import { z } from "zod";
import {
  LlamaModel,
  LlamaJsonSchemaGrammar,
  LlamaContext,
  LlamaChatSession,
  GbnfJsonSchema,
} from "node-llama-cpp";

import { CoreMessage } from "ai";

import { zodToJsonSchema } from "zod-to-json-schema";

export async function generateLlamaObject<T extends z.ZodSchema<any>>(
  model: LlamaModel,
  prompt: string,
  schema: T,
  messages: CoreMessage[] = [],
  temperature?: number
): Promise<T> {
  const convertedSchema = zodToJsonSchema(schema) as GbnfJsonSchema;
  // Type inference says this is `Type instantiation is excessively deep and possibly infinite
  // which is very silly so we have to cast it to `any` to make it work
  const grammar = new LlamaJsonSchemaGrammar(convertedSchema) as any;

  const context = new LlamaContext({ model });
  const session = new LlamaChatSession({ context });

  const messageText = messages.map((message) => message.content).join("\n");

  const result = await session.prompt(`${prompt}\n${messageText}`, {
    grammar,
    temperature,
  });
  return schema.parse(grammar.parse(result));
}
