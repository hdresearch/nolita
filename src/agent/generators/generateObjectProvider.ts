import { z } from "zod";
import Instructor from "@instructor-ai/instructor";

import { ObjectGeneratorOptions } from "./types";

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
