import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { Agent, ModelApi } from "./agent";
import { Inventory } from "../inventory";

export const CompletionDefaultRetries = 3;
export const CompletionDefaultTimeout = 300_000;
export const MinimumResponseTokens = 200;
export const MaximumResponseTokens = 8_000;

export type ProviderOptions = {
  provider: string;
  apiKey?: string;
  endpoint?: string;
  path?: string;
  model: string;
};

export function completionApiBuilder(
  providerOpts: ProviderOptions
): ModelApi | undefined {
  const _provider = providerOpts.provider.toLowerCase();

  if (providerOpts.path) {
    throw new Error("Custom path is not supported yet.");
  }

  if (_provider === "openai") {
    const openai = createOpenAI({
      apiKey: providerOpts.apiKey,
      baseURL: providerOpts.endpoint,
    });
    return openai.chat(providerOpts.model);
  } else if (_provider === "anthropic") {
    const anthropic = createAnthropic({
      apiKey: providerOpts.apiKey,
      baseURL: providerOpts.endpoint,
    });
    return anthropic.chat(providerOpts.model);
  }

  throw new Error(`Unknown provider: ${_provider}`);
}

export function makeAgent(
  prodiverOpts: ProviderOptions,
  opts?: { systemPrompt?: string }
) {
  const chatApi = completionApiBuilder(prodiverOpts);

  if (!chatApi) {
    throw new Error(`Failed to create chat api for ${prodiverOpts.provider}`);
  }

  return new Agent({
    modelApi: chatApi,
    systemPrompt: opts?.systemPrompt,
  });
}

export function defaultAgent() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "You must set OPENAI_API_KEY in your environment to use the default agent."
    );
  }
  return makeAgent({ provider: "openai", apiKey, model: "gpt-4" });
}
