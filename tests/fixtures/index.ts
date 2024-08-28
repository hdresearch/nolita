import { ProviderConfig } from "../../src/agent/config";

export const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4o-2024-08-06",
} as ProviderConfig;

export const DEFAULT_PROVIDER_CONFIG_ANTHROPIC: ProviderConfig = {
  provider: "anthropic",
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: "claude-3-opus-20240229",
} as ProviderConfig;
