import { z } from "zod";
// import {
//   LlamaModel,
//   LlamaJsonSchemaGrammar,
//   LlamaContext,
//   LlamaChatSession,
//   GbnfJsonSchema,
// } from "node-llama-cpp";
import { zodToJsonSchema } from "zod-to-json-schema";

import { ObjectGeneratorOptions } from "./types";
import { ChatRequestMessage } from "../messages";

/**
 * Generate an object using the local model.
 * @param model The model to use.
 * @param messages The messages to use.
 * @param options The options for the generator.
 * @param options.schema The schema for the model to generate
 * @param options.name The name of the schema
 * @param options.maxRetries The maximum number of retries
 * @param options.maxTokens The maximum number of tokens
 * @param options.temperature The temperature for the model
 * @param options.topP The topP for the model
 * @returns The generated schema
 */
export async function generateObjectLocal<T extends z.ZodSchema<any>>(
  path: string,
  messages: ChatRequestMessage[],
  options: ObjectGeneratorOptions & {
    schema: T;
    name: string;
  }
) {
  const { LlamaModel, LlamaContext, LlamaChatSession, LlamaJsonSchemaGrammar } =
    await Function('return import("node-llama-cpp")')();

  const model = new LlamaModel({ modelPath: path });

  const maxTokens = options.maxTokens || 1000;
  const temperature = options.temperature || 0;
  const schema = zodToJsonSchema(options.schema);
  const grammar = new LlamaJsonSchemaGrammar(schema) as any;

  const context = new LlamaContext({ model });
  const session = new LlamaChatSession({ context });

  const messagesString = messages
    .map((m: ChatRequestMessage) => {
      const content = m.content;
      if (typeof content === "string") {
        return content;
      } else if (Array.isArray(content)) {
        let concatString = "";
        content.forEach((c) => {
          if (c.type === "text") {
            // Since it's a text message, append its data
            concatString += c.text;
          }
        });
        return concatString;
      }
    })
    .join("\n");

  const res = await await session.prompt(messagesString, {
    grammar,
    temperature: temperature,
    maxTokens: maxTokens,
    topP: options.topP,
  });
  return grammar.parse(res);
}
