import { z } from "zod";
import { generateObject, CoreMessage } from "ai";
import { LanguageModelV1 } from "@ai-sdk/provider";

export async function generateProviderObject<T extends z.ZodSchema<any>>(
  model: LanguageModelV1,
  prompt: string,
  schema: T,
  messages: CoreMessage[] = [],
  opts: { temperature: number; maxRetries: number } = {
    temperature: 0,
    maxRetries: 5,
  }
): Promise<T> {
  const result = await generateObject({
    model,
    schema,
    messages: [{ role: "user", content: prompt }, ...messages],
    ...opts,
  });

  return result.object;
}
