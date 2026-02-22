import type { LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export type ChatProviderName = "openai" | "gemini" | "ollama";

export type ChatProviderConfig = {
  provider: ChatProviderName;
  model: string;
  apiKey?: string;
  baseURL?: string;
};

abstract class ChatProvider {
  protected readonly model: string;
  protected readonly apiKey?: string;
  protected readonly baseURL?: string;

  constructor(config: ChatProviderConfig) {
    this.model = config.model;
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL;
  }

  validateBase(): void {
    if (!this.model) {
      throw new Error("Model is required");
    }
  }

  abstract validate(): void;
  abstract createModel(): LanguageModel;
}

class OpenAIChatProvider extends ChatProvider {
  validate(): void {
    this.validateBase();
    if (!this.apiKey) {
      throw new Error("OpenAI API key is required");
    }
  }

  createModel(): LanguageModel {
    this.validate();
    return createOpenAI({
      apiKey: this.apiKey,
      ...(this.baseURL ? { baseURL: this.baseURL } : {}),
    })(this.model);
  }
}

class GeminiChatProvider extends ChatProvider {
  validate(): void {
    this.validateBase();
    if (!this.apiKey) {
      throw new Error("Gemini API key is required");
    }
  }

  createModel(): LanguageModel {
    this.validate();
    return createGoogleGenerativeAI({ apiKey: this.apiKey })(this.model);
  }
}

class OllamaChatProvider extends ChatProvider {
  validate(): void {
    this.validateBase();
  }

  createModel(): LanguageModel {
    this.validate();
    const base = this.baseURL || process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
    const baseURL = base.endsWith("/v1") ? base : `${base.replace(/\/+$/, "")}/v1`;
    return createOpenAI({
      baseURL,
      apiKey: this.apiKey || "ollama",
    })(this.model);
  }
}

export function createChatProvider(config: ChatProviderConfig): ChatProvider {
  switch (config.provider) {
    case "openai":
      return new OpenAIChatProvider(config);
    case "gemini":
      return new GeminiChatProvider(config);
    case "ollama":
      return new OllamaChatProvider(config);
    default:
      throw new Error(`Unsupported provider: ${String(config.provider)}`);
  }
}
