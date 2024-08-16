import { z } from "zod";
import { generateObject } from "ai";

import { ObjectGeneratorOptions } from "./types";
import { ChatRequestMessage } from "../messages";
import { ollama } from "ollama-ai-provider";

export async function generateObjectOllama<T extends z.ZodSchema<any>>(
  model: string,
  messages: ChatRequestMessage[],
  options: ObjectGeneratorOptions & {
    schema: T;
    name: string;
  }
) {
  try {
    return await generateObject({
      mode: "json",
      model: ollama(model),
      messages: messages,
      schema: options.schema,
    });
  } catch (e: any) {
    console.log(e.message.trim());
    if (e.message.trim() === "fetch failed") {
      console.log("caught error");
      throw new Error(
        "Fetch failed while generating object. Is your ollama server running?"
      );
    }
    throw new Error("Error generating object");
  }
}
