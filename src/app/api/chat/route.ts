import { NextRequest } from "next/server";
import { convertToModelMessages, streamText } from "ai";
import { createChatProvider, type ChatProviderName } from "@/lib/llm/chat-provider";

type Chunk = {
  id: string;
  text: string;
  pageStart: number;
  pageEnd: number;
};

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
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

function selectTopChunks(chunks: Chunk[], query: string, limit = 8): Chunk[] {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return chunks.slice(0, limit);

  return [...chunks]
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryTokens) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.chunk);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const provider = (body?.provider || "ollama") as ChatProviderName;
  const model = String(body?.model || "").trim();
  const apiKey = String(body?.apiKey || "").trim();
  const baseURL = String(body?.baseURL || "").trim();
  const chunks = (Array.isArray(body?.chunks) ? body.chunks : []) as Chunk[];
  const messages = Array.isArray(body?.messages) ? body.messages : [];

  if (!provider || !model) {
    return new Response("Missing provider/model", { status: 400 });
  }
  if (provider !== "ollama" && !apiKey) {
    return new Response("Missing apiKey for selected provider", { status: 400 });
  }

  const latestUserMessage = [...messages]
    .reverse()
    .find((message: any) => message?.role === "user");
  const latestText = String(latestUserMessage?.content || "").trim();
  const topChunks = selectTopChunks(chunks, latestText, 8);
  const context = topChunks
    .map(
      (chunk, index) =>
        `[C${index + 1}] (pages ${chunk.pageStart}-${chunk.pageEnd})\n${chunk.text.slice(0, 2200)}`,
    )
    .join("\n\n");

  const system = [
    "You answer questions about a PDF using ONLY the provided chunk context.",
    "If the answer is not present, explicitly say it is not found in the provided document context.",
    "Cite chunk references like [C1], [C2] in your answer when used.",
    "",
    "PDF chunk context:",
    context || "(no context provided)",
  ].join("\n");

  const orderedContextMessages = messages
    .filter((message: any) => message?.role === "user" || message?.role === "assistant")
    .slice(-24);

  try {
    const modelInstance = createChatProvider({
      provider,
      model,
      apiKey,
      baseURL: baseURL || undefined,
    }).createModel();

    const result = streamText({
      model: modelInstance,
      system,
      messages: await convertToModelMessages(orderedContextMessages),
      temperature: 0.2,
      maxOutputTokens: 1100,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      `Chat request failed (${provider}/${model}${baseURL ? ` @ ${baseURL}` : ""}): ${message}`,
      { status: 500 },
    );
  }
}
