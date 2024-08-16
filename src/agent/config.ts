import { createLLMClient } from "llm-polyglot";
import { ollama } from "ollama-ai-provider";

import {
  ObjectGeneratorOptions,
  DefaultObjectGeneratorOptions,
} from "./generators";

export const CompletionDefaultRetries = 3;
export const CompletionDefaultTimeout = 300_000;
export const MinimumResponseTokens = 200;
export const MaximumResponseTokens = 8_000;

export type AgentConfig = {
  client: any;
  provider: string;
  apiKey: string;
};

export type ModelConfig = DefaultObjectGeneratorOptions &
  Omit<ObjectGeneratorOptions, keyof DefaultObjectGeneratorOptions> & {
    systemPrompt?: string;
  };

export function completionApiBuilder(
  prodiverOpts: { provider: string; apiKey: string },
  modelConfig: Partial<ModelConfig> = {},
  customProvider?: { path: string }
): AgentConfig & ModelConfig {
  const defaultConfig: ModelConfig = {
    objectMode: "TOOLS",
    model: "gpt-4",
  };
  const finalConfig: ModelConfig = { ...defaultConfig, ...modelConfig };
  const provider = prodiverOpts.provider.toLowerCase();

  const systemPrompt = finalConfig.systemPrompt;
  const maxTokens = finalConfig.maxTokens;
  const temperature = finalConfig.temperature || 0;
  const maxRetries = finalConfig.maxRetries || CompletionDefaultRetries;

  let client: any;

  if (provider === "openai") {
    client = createLLMClient({
      provider,
      apiKey: prodiverOpts.apiKey,
    });
  } else if (provider === "anthropic") {
    client = createLLMClient({
      provider,
      apiKey: prodiverOpts.apiKey,
    });
  } else if (provider === "ollama") {
    if (!modelConfig.model) {
      throw new Error("Model is required for Ollama provider");
    }
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }

  return {
    client,
    provider,
    objectMode: "TOOLS",
    apiKey: prodiverOpts.apiKey,
    model: finalConfig.model,
    systemPrompt,
    maxTokens,
    temperature,
    maxRetries,
  };
}
