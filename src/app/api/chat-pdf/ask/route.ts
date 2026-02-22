import { NextRequest, NextResponse } from "next/server";
import { askProvider, type LlmProvider } from "@/lib/llm/providers";

type Chunk = {
  id: string;
  text: string;
  pageStart: number;
  pageEnd: number;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function scoreChunk(chunk: Chunk, queryTokens: string[]): number {
  const hay = chunk.text.toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    const re = new RegExp(`\\b${token}\\b`, "g");
    const matches = hay.match(re);
    if (matches) score += matches.length;
  }
  return score;
}

function selectTopChunks(chunks: Chunk[], question: string, limit = 8): Chunk[] {
  const queryTokens = tokenize(question);
  if (queryTokens.length === 0) return chunks.slice(0, limit);
  return [...chunks]
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryTokens) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.chunk);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const provider = body?.provider as LlmProvider;
    const apiKey = String(body?.apiKey || "").trim();
    const model = String(body?.model || "").trim();
    const question = String(body?.question || "").trim();
    const chunks = (Array.isArray(body?.chunks) ? body.chunks : []) as Chunk[];
    const history = (Array.isArray(body?.history) ? body.history : []) as ChatMessage[];

    if (!provider || !apiKey || !model || !question) {
      return NextResponse.json(
        { error: "Missing required fields: provider, apiKey, model, question" },
        { status: 400 },
      );
    }

    if (!chunks.length) {
      return NextResponse.json(
        { error: "No extracted PDF chunks available. Upload and extract first." },
        { status: 400 },
      );
    }

    const topChunks = selectTopChunks(chunks, question, 8);
    const context = topChunks
      .map(
        (c, i) =>
          `[C${i + 1}] (pages ${c.pageStart}-${c.pageEnd})\n${c.text.slice(0, 2400)}`,
      )
      .join("\n\n");

    const historyText = history
      .slice(-6)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const systemPrompt =
      "You answer questions using only the provided PDF context chunks. If the answer is not in context, say so clearly. Cite chunks in the form [C1], [C2]. Keep answers concise.";

    const userPrompt = [
      "Conversation history:",
      historyText || "(none)",
      "",
      "Question:",
      question,
      "",
      "PDF context chunks:",
      context,
    ].join("\n");

    const answer = await askProvider({
      provider,
      apiKey,
      model,
      systemPrompt,
      userPrompt,
      temperature: 0.2,
      maxTokens: 1100,
    });

    return NextResponse.json({
      answer: answer || "No answer generated.",
      citations: topChunks.map((c, i) => ({
        id: `C${i + 1}`,
        pageStart: c.pageStart,
        pageEnd: c.pageEnd,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
