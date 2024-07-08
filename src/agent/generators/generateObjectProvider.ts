import { z } from "zod";
import Instructor from "@instructor-ai/instructor";

import { ObjectGeneratorOptions } from "./types";

/**
 *
 * @param client The LLM client
 * @param messages The message array to send to the model
 * @param options The options for the object generator
 * @param options.schema The return schema for the object
 * @param options.name The name of the object (used in the tool call)
 * @param options.model The model to use for the object generation
 * @param options.objectMode The object mode to use for the object generation (default: TOOLS)
 * @param options.maxRetries The maximum number of retries (default: 3)
 * @param options.maxTokens The maximum number of tokens (default: 1000)
 * @param options.temperature The temperature for the model (default: 0)
 * @returns
 */
export async function generateObjectProvider<T extends z.ZodSchema<any>>(
  client: any,
  messages: any,
  options: ObjectGeneratorOptions & {
    schema: T;
    name: string;
  }
) {
  const instructor = Instructor<typeof client>({
    client,
    mode: options.objectMode,
    // log to void
    logger: undefined,
  });

  const maxRetries = options.maxRetries || 3;
  const maxTokens = options.maxTokens || 1000;
  const temperature = options.temperature || 0;

  const res = await instructor.chat.completions.create({
    messages,
    model: options.model,
    response_model: { schema: options.schema, name: options.name },
    max_tokens: maxTokens,
    temperature: temperature,
    max_retries: maxRetries,
  });

  return options.schema.parse(res);
}
