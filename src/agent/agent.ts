import { ProviderConfig, Providers } from "./config";
import { nolitarc } from "../utils/config";
import { ModelConfig } from "./config";

export function stringifyObjects<T>(obj: T[]): string {
  const strings = obj.map((o) => JSON.stringify(o));
  return strings.join("\n");
}

export function makeAgent(
  prodiverOpts?: { provider: string; apiKey: string },
  modelConfig?: Partial<ModelConfig>
) {
  if (!prodiverOpts) {
    const { agentApiKey, agentProvider, agentModel } = nolitarc();
    prodiverOpts = { provider: agentProvider, apiKey: agentApiKey };
    modelConfig = { model: agentModel, objectMode: "TOOLS" };
  }

  if (!modelConfig?.model) {
    throw new Error("You must provide a model to create an agent.");
  }

  if (!prodiverOpts.provider) {
    throw new Error("You must provide a provider to create an agent.");
  }

  const providerConfig: ProviderConfig = {
    provider: prodiverOpts.provider as Providers,
    apiKey: prodiverOpts.apiKey,
    model: modelConfig.model,
  };
  return providerConfig;
}

export function defaultAgent() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "You must set OPENAI_API_KEY in your environment to use the default agent."
    );
  }
  return makeAgent(
    { provider: "openai", apiKey },
    { model: "gpt-4", objectMode: "TOOLS" }
  );
}
