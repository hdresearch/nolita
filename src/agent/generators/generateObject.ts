import { z } from "zod";
import { generateObjectLocal } from "./generateObjectLocal";
import { generateObjectProvider } from "./generateObjectProvider";

import { LlamaModel } from "node-llama-cpp";
import { ObjectGeneratorOptions } from "./types";

export async function generateObject<T extends z.ZodSchema<any>>(
  client: any,
  messages: any,
  options: ObjectGeneratorOptions & {
    schema: T;
    name: string;
  }
) {
  switch (client) {
    case client instanceof LlamaModel:
      return generateObjectLocal(client, messages, options);
    default:
      return generateObjectProvider(client, messages, options);
  }
}
