import { createLLMClient } from "llm-polyglot";

import { Agent } from "./agent";
import { nolitarc } from "../utils/config";
import { ObjectGeneratorOptions } from "./generators";

export const CompletionDefaultRetries = 3;
export const CompletionDefaultTimeout = 300_000;
export const MinimumResponseTokens = 200;
export const MaximumResponseTokens = 8_000;

export type AgentConfig = {
  client: any;
  provider: string;
  apiKey: string;
};

export type ModelConfig = ObjectGeneratorOptions & { systemPrompt?: string };

export function completionApiBuilder(
  prodiverOpts: { provider: string; apiKey: string },
  modelConfig: ModelConfig = { objectMode: "TOOLS", model: "gpt-4" },
  customProvider?: { path: string }
): AgentConfig & ModelConfig {
  const provider = prodiverOpts.provider.toLowerCase();

  const systemPrompt = modelConfig.systemPrompt;
  const maxTokens = modelConfig.maxTokens;
  const temperature = modelConfig.temperature || 0;
  const maxRetries = modelConfig.maxRetries || CompletionDefaultRetries;
  if (customProvider) {
    throw new Error("Custom provider not implemented");
  }

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
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }

  return {
    client,
    provider,
    objectMode: "TOOLS",
    apiKey: prodiverOpts.apiKey,
    model: modelConfig.model,
    systemPrompt,
    maxTokens,
    temperature,
    maxRetries,
  };
}
