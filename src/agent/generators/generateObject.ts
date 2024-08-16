import { z } from "zod";

import { createAnthropic } from "@ai-sdk/anthropic";

import { generateObjectProvider } from "./generateObjectProvider";
import { generateObjectOllama } from "./generateObjectOllama";
import { ObjectGeneratorOptions } from "./types";
import { ChatRequestMessage } from "../messages";
import { ProviderConfig } from "../config";
import { generateObjectOpenAI } from "./generateObjectOpenAi";

/**
 * Wrapper function to generate an object using either the local model or a provider.
 * @param client The client to use
 * @param messages The messages to use
 * @param options The options for the object generator
 * @param options.schema The schema for the object
 * @param options.name The name of the object (used in the tool call)
 * @param options.model The model to use for the object generation
 * @param options.objectMode The object mode to use for the object generation (default: TOOLS)
 * @param options.maxRetries The maximum number of retries (default: 3)
 * @param options.maxTokens The maximum number of tokens (default: 1000)
 * @param options.temperature The temperature for the model (default: 0)
 * @param options.topP The topP for the model (default: 1)
 * @returns The generated object
 */
export async function generateObject<T extends z.ZodSchema<any>>(
  config: ProviderConfig,
  messages: ChatRequestMessage[],
  options: ObjectGeneratorOptions & {
    schema: T;
    name: string;
  }
) {
  switch (config.provider) {
    case "ollama": // Ollama has its own function to generate objects because of error handling reasons
      return generateObjectOllama(config.model, messages, options);
    case "openai":
      return await generateObjectOpenAI(config, messages, options);
    case "anthropic": {
      const provider = createAnthropic({ apiKey: config.apiKey });
      return generateObjectProvider(config, provider, messages, options);
    }
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}
