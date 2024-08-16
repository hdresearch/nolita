import { z } from "zod";
import { generateObject } from "ai";

import { ObjectGeneratorOptions } from "./types";
import { ChatRequestMessage } from "../messages";

export async function generateObjectOllama<T extends z.ZodSchema<any>>(
  model: any,
  messages: ChatRequestMessage[],
  options: ObjectGeneratorOptions & {
    schema: T;
    name: string;
  }
) {
  const reformattedMessages = messages.map((m: ChatRequestMessage) => {
    if (typeof m.content === "string" && m.role !== "tool") {
      return { role: m.role, content: m.content };
    }
  });

  if (!reformattedMessages.length) {
    throw new Error("No messages found");
  }

  return await generateObject({
    mode: "json",
    model,
    messages: reformattedMessages as any,
    schema: options.schema,
  });
}
