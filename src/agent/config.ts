import {
  CompletionApi,
  AnthropicChatApi,
  OpenAIChatApi,
  ModelConfig,
} from "llm-api";

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
