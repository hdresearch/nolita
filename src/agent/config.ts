import {
  ObjectGeneratorOptions,
  DefaultObjectGeneratorOptions,
} from "./generators";

export const CompletionDefaultRetries = 3;
export const CompletionDefaultTimeout = 300_000;
export const MinimumResponseTokens = 200;
export const MaximumResponseTokens = 8_000;

export type ThirdPartyProviders = "openai" | "anthropic";
export type LocalProviders = "ollama" | "local";
export type Providers = ThirdPartyProviders | LocalProviders;

export type ProviderConfig = {
  provider: Providers;
  apiKey: string;
  model: string;
};

export type AgentConfig = {
  client: any;
  provider: string;
  apiKey: string;
};

export type ModelConfig = DefaultObjectGeneratorOptions &
  Omit<ObjectGeneratorOptions, keyof DefaultObjectGeneratorOptions> & {
    systemPrompt?: string;
  };
