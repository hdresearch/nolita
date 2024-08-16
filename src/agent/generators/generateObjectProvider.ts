import { z } from "zod";
import { OpenAIProvider } from "@ai-sdk/openai";
import { AnthropicProvider } from "@ai-sdk/anthropic";

import { generateObject } from "ai";

import { ChatRequestMessage } from "../messages";
import { ObjectGeneratorOptions } from "./types";
import { ProviderConfig } from "../config";

export type ProviderClients = AnthropicProvider | OpenAIProvider;

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

// /**
//  *
//  * @param client The LLM client
//  * @param messages The message array to send to the model
//  * @param options The options for the object generator
//  * @param options.schema The return schema for the object
//  * @param options.name The name of the object (used in the tool call)
//  * @param options.model The model to use for the object generation
//  * @param options.objectMode The object mode to use for the object generation (default: TOOLS)
//  * @param options.maxRetries The maximum number of retries (default: 3)
//  * @param options.maxTokens The maximum number of tokens (default: 1000)
//  * @param options.temperature The temperature for the model (default: 0)
//  * @returns
//  */
// export async function generateObjectProvider<T extends z.ZodSchema<any>>(
//   config: ProviderConfig,
//   messages: ChatRequestMessage[],
//   options: ObjectGeneratorOptions & {
//     schema: T;
//     name: string;
//   }
// ) {
//   const client = createLLMClient({
//     provider: config.provider as ThridPartyProviders,
//     apiKey: config.apiKey,
//   });

//   const instructor = Instructor<typeof client>({
//     client,
//     mode: options.objectMode,
//     // log to void
//     logger: undefined,
//   });

//   const maxRetries = options.maxRetries || 3;
//   const maxTokens = options.maxTokens || 1000;
//   const temperature = options.temperature || 0;

//   const res = await instructor.chat.completions.create({
//     messages,
//     model: options.model,
//     response_model: { schema: options.schema, name: options.name },
//     max_tokens: maxTokens,
//     temperature: temperature,
//     max_retries: maxRetries,
//   });

//   return options.schema.parse(res);
// }
