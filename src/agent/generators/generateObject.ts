import { z } from "@hono/zod-openapi";
// import { LlamaModel } from "node-llama-cpp";
// import { generateObjectLocal } from "./generateObjectLocal";

import { generateObjectProvider } from "./generateObjectProvider";
import { ObjectGeneratorOptions } from "./types";
import { ChatRequestMessage } from "../messages";

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
  client: any,
  messages: ChatRequestMessage[],
  options: ObjectGeneratorOptions & {
    schema: T;
    name: string;
  },
) {
  switch (client) {
    // case client instanceof LlamaModel:
    //   return generateObjectLocal(client, messages, options);
    //   throw new Error("Local modle generation not implemented");
    default:
      return generateObjectProvider(client, messages, options);
  }
}
