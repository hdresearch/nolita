import { z } from "zod";
import { LanguageModelV1 } from "@ai-sdk/provider";
// import { LlamaModel } from "node-llama-cpp";
import { CoreMessage } from "ai";

import { generateProviderObject } from "./providerCompletion";
import { generateLlamaObject } from "./llamaCompletion";

export type ModelApi = LanguageModelV1;

export async function generateObject<T extends z.ZodSchema<any>>(
  model: ModelApi,
  schema: T,
  messages: CoreMessage[] = [],
  opts: { temperature: number; maxRetries: number } = {
    temperature: 0,
    maxRetries: 3,
  }
) {
  switch (model.constructor) {
    default:
      return generateProviderObject(
        model as LanguageModelV1,
        schema,
        messages,
        opts
      );

    // Need to figure out why importing llamaModel is causing an error
    // case LlamaModel:
    //   return generateLlamaObject(
    //     model as LlamaModel,
    //     prompt,
    //     schema,
    //     messages,
    //     opts.temperature
    //   );
  }
}
