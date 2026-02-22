#!/usr/bin/env node
import { WebSocketServer } from "ws";

const PORT = Number(process.env.CHAT_WS_PORT || 8000);
const HOST = process.env.CHAT_WS_HOST || "127.0.0.1";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3:8b";
const OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

/**
 * Quick token-aware retrieval settings.
 * We keep these conservative so large PDF chunk lists do not exhaust context.
 */
const MAX_CONTEXT_CHUNKS = 8;
const MAX_CHUNK_CHARS = 1400;
const MAX_CONTEXT_CHARS = 9000;
const MAX_HISTORY_TURNS = 6;
const EMBED_BATCH_SIZE = 24;
const MMR_LAMBDA = 0.75;

function computeChunkSignature(chunks) {
  // Fast non-cryptographic signature so repeated context updates with same chunks
  // can skip expensive re-embedding.
  let hash = 2166136261;
  for (const chunk of chunks) {
    const id = String(chunk?.id || "");
    const pageStart = Number(chunk?.pageStart || 0);
    const pageEnd = Number(chunk?.pageEnd || 0);
    const textLength = String(chunk?.text || "").length;
    const token = `${id}|${pageStart}|${pageEnd}|${textLength}`;
    for (let i = 0; i < token.length; i++) {
      hash ^= token.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
  }
  return `${chunks.length}:${(hash >>> 0).toString(16)}`;
}

function tokenize(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function scoreChunk(chunk, queryTokens) {
  const text = String(chunk?.text || "").toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    const re = new RegExp(`\\b${token}\\b`, "g");
    const hits = text.match(re);
    if (hits) score += hits.length;
  }
  return score;
}

function selectContextChunks(chunks, query) {
  const queryTokens = tokenize(query);
  const sorted = [...chunks]
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryTokens) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.chunk);

  const selected = [];
  let totalChars = 0;

  for (const chunk of sorted) {
    if (selected.length >= MAX_CONTEXT_CHUNKS) break;
    const text = String(chunk?.text || "").slice(0, MAX_CHUNK_CHARS);
    if (!text) continue;
    if (totalChars + text.length > MAX_CONTEXT_CHARS) break;
    selected.push({
      id: chunk?.id,
      pageStart: chunk?.pageStart,
      pageEnd: chunk?.pageEnd,
      text,
    });
    totalChars += text.length;
  }

  return selected;
}

function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    const av = Number(a[i] || 0);
    const bv = Number(b[i] || 0);
    dot += av * bv;
    magA += av * av;
    magB += bv * bv;
  }
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function normalizeScores(values) {
  if (!values.length) return values;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

function mmrSelect(candidates, k) {
  if (candidates.length <= k) return candidates;
  const selected = [];
  const remaining = [...candidates];

  // Start from the top hybrid score item.
  remaining.sort((a, b) => b.hybrid - a.hybrid);
  selected.push(remaining.shift());

  while (selected.length < k && remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      let maxSimilarityToSelected = 0;
      for (const picked of selected) {
        maxSimilarityToSelected = Math.max(
          maxSimilarityToSelected,
          cosine(candidate.embedding || [], picked.embedding || []),
        );
      }

      const mmr = MMR_LAMBDA * candidate.hybrid - (1 - MMR_LAMBDA) * maxSimilarityToSelected;
      if (mmr > bestScore) {
        bestScore = mmr;
        bestIdx = i;
      }
    }

    selected.push(remaining.splice(bestIdx, 1)[0]);
  }

  return selected;
}

async function ollamaEmbed(input) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_EMBED_MODEL,
      input,
      truncate: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`embed failed (${response.status}): ${body || response.statusText}`);
  }

  const json = await response.json();
  return Array.isArray(json?.embeddings) ? json.embeddings : [];
}

async function embedChunks(chunks) {
  if (!chunks.length) return [];
  const embeddings = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const slice = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const inputs = slice.map((chunk) => String(chunk.text || "").slice(0, MAX_CHUNK_CHARS));
    const batch = await ollamaEmbed(inputs);
    embeddings.push(...batch);
  }
  return embeddings;
}

async function selectContextChunksHybrid(chunks, query, chunkEmbeddings) {
  if (!chunks.length) return [];

  const sparseTokens = tokenize(query);
  const sparseRaw = chunks.map((chunk) => scoreChunk(chunk, sparseTokens));
  const sparse = normalizeScores(sparseRaw);

  let dense = chunks.map(() => 0);
  let queryEmbedding = null;
  if (Array.isArray(chunkEmbeddings) && chunkEmbeddings.length === chunks.length) {
    try {
      const [embeddedQuery] = await ollamaEmbed(query);
      queryEmbedding = embeddedQuery;
    } catch {
      queryEmbedding = null;
    }
  }

  if (queryEmbedding) {
    const denseRaw = chunks.map((chunk, index) => cosine(queryEmbedding, chunkEmbeddings[index] || []));
    dense = normalizeScores(denseRaw);
  }

  // Hybrid fusion inspired by common RAG patterns: combine lexical + semantic signals.
  const candidates = chunks.map((chunk, index) => ({
    id: chunk.id,
    pageStart: chunk.pageStart,
    pageEnd: chunk.pageEnd,
    text: String(chunk.text || "").slice(0, MAX_CHUNK_CHARS),
    sparse: sparse[index] || 0,
    dense: dense[index] || 0,
    hybrid: queryEmbedding ? 0.65 * (dense[index] || 0) + 0.35 * (sparse[index] || 0) : (sparse[index] || 0),
    embedding: chunkEmbeddings?.[index] || null,
  }));

  // MMR keeps relevance high while reducing redundant chunks.
  const diversified = mmrSelect(candidates, MAX_CONTEXT_CHUNKS * 2).sort((a, b) => b.hybrid - a.hybrid);

  const selected = [];
  let totalChars = 0;
  for (const chunk of diversified) {
    if (selected.length >= MAX_CONTEXT_CHUNKS) break;
    if (!chunk.text) continue;
    if (totalChars + chunk.text.length > MAX_CONTEXT_CHARS) break;
    selected.push({
      id: chunk.id,
      pageStart: chunk.pageStart,
      pageEnd: chunk.pageEnd,
      text: chunk.text,
    });
    totalChars += chunk.text.length;
  }

  return selected;
}

function safeSend(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function parseJson(data) {
  try {
    return JSON.parse(String(data));
  } catch {
    return null;
  }
}

function buildSystemPrompt(selectedChunks, stats) {
  const references = selectedChunks
    .map(
      (chunk, index) =>
        `[C${index + 1}] pages ${chunk.pageStart || "?"}-${chunk.pageEnd || "?"}\n${chunk.text}`,
    )
    .join("\n\n");

  return [
    "You are a PDF assistant. Answer using only provided PDF context chunks.",
    "If context is insufficient, clearly say so.",
    "Cite context references like [C1], [C2] when used.",
    stats ? `Document stats: ${JSON.stringify(stats)}` : "",
    "PDF context:",
    references || "(no chunks available)",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function normalizeContext(rawContext) {
  const chunks = Array.isArray(rawContext?.chunks)
    ? rawContext.chunks
        .map((chunk) => ({
          id: String(chunk?.id || ""),
          text: String(chunk?.text || ""),
          pageStart: Number(chunk?.pageStart || 0),
          pageEnd: Number(chunk?.pageEnd || 0),
        }))
        .filter((chunk) => chunk.text.length > 0)
    : [];

  return {
    chunks,
    stats: rawContext?.stats || null,
    files: rawContext?.files || [],
    extraction: rawContext?.extraction || null,
  };
}

const wss = new WebSocketServer({ host: HOST, port: PORT, path: "/ws/chat" });

console.log(`[chat-ws] listening on ws://${HOST}:${PORT}/ws/chat`);
console.log(`[chat-ws] using ollama ${OLLAMA_BASE_URL}, model=${OLLAMA_MODEL}`);
console.log(`[chat-ws] embedding model=${OLLAMA_EMBED_MODEL}`);

wss.on("connection", (ws) => {
  // Per-connection state.
  let context = { chunks: [], stats: null, files: [], extraction: null };
  let chunkEmbeddings = [];
  let chunkSignature = "";
  const history = [];

  safeSend(ws, { type: "assistant_message", content: "Connected. Upload PDFs and start chatting." });

  ws.on("message", async (raw) => {
    const payload = parseJson(raw);
    if (!payload) {
      safeSend(ws, { type: "error", message: "Invalid JSON payload" });
      return;
    }

    if (payload.type === "context_update") {
      context = normalizeContext(payload.context);
      const nextSignature = computeChunkSignature(context.chunks);
      const chunksChanged = nextSignature !== chunkSignature;
      if (chunksChanged) {
        chunkEmbeddings = [];
        chunkSignature = nextSignature;
        if (context.chunks.length) {
          try {
            chunkEmbeddings = await embedChunks(context.chunks);
            console.log(`[chat-ws] embedded ${chunkEmbeddings.length} chunks`);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(`[chat-ws] embedding failed, fallback to lexical retrieval: ${message}`);
          }
        }
      } else {
        console.log(`[chat-ws] context_update received with unchanged chunks (${context.chunks.length}); reusing embeddings`);
      }
      safeSend(ws, {
        type: "context_ack",
        contextId: String(payload.contextId || ""),
        chunks: context.chunks.length,
      });
      safeSend(ws, {
        type: "assistant_message",
        content: `Context updated: ${context.chunks.length} chunks, ${context.files.length} files.${chunkEmbeddings.length ? " Hybrid retrieval enabled." : " Lexical retrieval enabled."}`,
      });
      return;
    }

    if (payload.type !== "user_message") {
      safeSend(ws, { type: "error", message: `Unsupported payload type: ${payload.type}` });
      return;
    }

    const query = String(payload.content || "").trim();
    if (!query) return;

    const selected = chunkEmbeddings.length === context.chunks.length
      ? await selectContextChunksHybrid(context.chunks, query, chunkEmbeddings)
      : selectContextChunks(context.chunks, query);
    const system = buildSystemPrompt(selected, context.stats);

    const recentHistory = history.slice(-MAX_HISTORY_TURNS * 2);
    const ollamaMessages = [
      { role: "system", content: system },
      ...recentHistory,
      { role: "user", content: query },
    ];

    const assistantId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    safeSend(ws, { type: "assistant_start", id: assistantId, timestamp: Date.now() });

    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: true,
          messages: ollamaMessages,
          options: {
            num_ctx: 8192,
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok || !response.body) {
        const body = await response.text().catch(() => "");
        throw new Error(`Ollama error (${response.status}): ${body || response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const json = parseJson(line);
          if (!json) continue;

          const token = String(json?.message?.content || "");
          if (token) {
            fullText += token;
            safeSend(ws, { type: "assistant_token", id: assistantId, token });
          }

          if (json.done) {
            safeSend(ws, { type: "assistant_end", id: assistantId, timestamp: Date.now() });
          }
        }
      }

      history.push({ role: "user", content: query });
      history.push({ role: "assistant", content: fullText });
      while (history.length > MAX_HISTORY_TURNS * 2) history.shift();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      safeSend(ws, { type: "error", message });
      safeSend(ws, { type: "assistant_end", id: assistantId, timestamp: Date.now() });
    }
  });
});
