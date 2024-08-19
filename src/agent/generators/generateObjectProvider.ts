import { z } from "zod";
import { OpenAIProvider } from "@ai-sdk/openai";
import { AnthropicProvider } from "@ai-sdk/anthropic";

import { generateObject } from "ai";

import { ChatRequestMessage } from "../messages";
import { ObjectGeneratorOptions } from "./types";
import { ProviderConfig } from "../config";

export type ProviderClients = AnthropicProvider | OpenAIProvider;

/**
 *
 * @param config -- The provider configuration
 * @param client -- The provider client
 * @param messages -- The messages to send to the model
 * @param options -- The options for the object generator
 * @param options.schema -- The return schema for the object
 * @param options.name -- The name of the object (used in the tool call)
 * @param options.description -- The description of the object
 * @returns options.schema
 */
export async function generateObjectProvider<T extends z.ZodSchema<any>>(
  config: ProviderConfig,
  client: ProviderClients,
  messages: ChatRequestMessage[],
  options: ObjectGeneratorOptions & {
    schema: T;
    name?: string;
    description?: string;
  }
) {
  const model = client(config.model);
  const result = await generateObject({
    mode: "auto",
    model,
    messages: messages,
    schemaDescription: options.description,
    schemaName: options.name,
    schema: options.schema,
  });
  console.log(result.finishReason);
  return result.object;
}
