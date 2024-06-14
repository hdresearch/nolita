import { z } from "zod";
import { LanguageModelV1 } from "@ai-sdk/provider";
import { LlamaModel } from "node-llama-cpp";
import { CoreMessage } from "ai";

import { generateProviderObject } from "./providerCompletion";
import { generateLlamaObject } from "./llamaCompletion";

export async function generateObject<T extends z.ZodSchema<any>>(
  model: LanguageModelV1 | LlamaModel,
  prompt: string,
  schema: T,
  messages: CoreMessage[] = [],
  opts: { temperature: number; maxRetries: number } = {
    temperature: 0,
    maxRetries: 5,
  }
) {
  switch (model.constructor) {
    default:
      return generateProviderObject(
        model as LanguageModelV1,
        prompt,
        schema,
        messages,
        opts
      );

    case LlamaModel:
      return generateLlamaObject(
        model as LlamaModel,
        prompt,
        schema,
        messages,
        opts.temperature
      );
  }
}
