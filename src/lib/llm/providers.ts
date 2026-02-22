export type LlmProvider = "openai" | "gemini";

export type ChatRequest = {
  provider: LlmProvider;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
};

async function postJson<T>(
  url: string,
  init: RequestInit,
  timeoutMs = 45000,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(
        `Provider error (${response.status}): ${text.slice(0, 500)}`,
      );
    }
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function askOpenAI(input: ChatRequest): Promise<string> {
  type OpenAIResponse = {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const data = await postJson<OpenAIResponse>(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        temperature: input.temperature ?? 0.2,
        max_tokens: input.maxTokens ?? 1000,
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.userPrompt },
        ],
      }),
    },
  );

  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function askGemini(input: ChatRequest): Promise<string> {
  type GeminiResponse = {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const model = input.model || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(input.apiKey)}`;

  const data = await postJson<GeminiResponse>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${input.systemPrompt}\n\n${input.userPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: input.temperature ?? 0.2,
        maxOutputTokens: input.maxTokens ?? 1000,
      },
    }),
  });

  const parts = data.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || "").join("\n").trim();
}

export async function askProvider(input: ChatRequest): Promise<string> {
  if (input.provider === "openai") {
    return askOpenAI(input);
  }
  if (input.provider === "gemini") {
    return askGemini(input);
  }
  throw new Error(`Unsupported provider: ${input.provider}`);
}
