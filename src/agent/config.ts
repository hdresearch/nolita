import {
  CompletionApi,
  AnthropicChatApi,
  OpenAIChatApi,
  ModelConfig,
} from "llm-api";
import { Agent } from "./agent";
import { nolitarc } from "../utils/config";

export const CompletionDefaultRetries = 3;
export const CompletionDefaultTimeout = 300_000;
export const MinimumResponseTokens = 200;
export const MaximumResponseTokens = 8_000;

export function completionApiBuilder(
  prodiverOpts: { provider: string; apiKey: string },
  modelConfig: ModelConfig,
  customProvider?: CompletionApi
): CompletionApi | undefined {
  const _provider = prodiverOpts.provider.toLowerCase();

  if (_provider === "openai") {
    return new OpenAIChatApi(
      {
        apiKey: prodiverOpts.apiKey,
      },
      modelConfig
    );
  } else if (_provider === "anthropic") {
    return new AnthropicChatApi(
      {
        apiKey: prodiverOpts.apiKey,
      },
      modelConfig
    );
  } else if (customProvider) {
    return customProvider;
  }

  throw new Error(`Unknown provider: ${_provider}`);
}

export function makeAgent(
  prodiverOpts?: { provider: string; apiKey: string },
  modelConfig?: ModelConfig,
  customProvider?: CompletionApi,
  opts?: { systemPrompt?: string }
) {
  if (!prodiverOpts) {
    const { agentApiKey, agentProvider, agentModel } = nolitarc();
    prodiverOpts = { provider: agentProvider, apiKey: agentApiKey };
    modelConfig = { model: agentModel };
  }
  if (!prodiverOpts.provider) {
    throw new Error("Provider is required");
  }
  if (!modelConfig?.model) {
    throw new Error("Model is required");
  }
  const chatApi = completionApiBuilder(
    prodiverOpts,
    modelConfig,
    customProvider
  );

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
  return makeAgent({ provider: "openai", apiKey }, { model: "gpt-4" });
}
