import { z } from "zod";
import Instructor from "@instructor-ai/instructor";
import { Logger } from "../utils";

export type ObjectGeneratorMode =
  | "TOOLS"
  | "JSON"
  | "MD_JSON"
  | "JSON_SCHEMA"
  | "FUNCTIONS";

export type ObjectGeneratorOptions<T extends z.ZodSchema<any>> = {
  model: string;
  objectMode: ObjectGeneratorMode;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  maxRetries?: number;
  logger?: <T extends unknown[]>(level: string, ...args: T) => void;
};

export async function generateObjectProvider(
  client: any,
  messages: any,
  options: ObjectGeneratorOptions<any> & {
    schema: z.ZodSchema<any>;
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
