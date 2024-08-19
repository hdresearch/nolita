import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ProviderConfig } from "../config";
import { z } from "zod";
import { ObjectGeneratorOptions } from "./types";
import { ChatRequestMessage } from "../messages";
import { ChatCompletionMessageParam } from "openai/resources";

export function convertCoreMessageToOpenAI(message: ChatRequestMessage):
  | {
      role: string;
      content: string;
    }
  | undefined {
  const content = message.content;
  if (typeof content === "string") {
    return { role: message.role, content: content };
  }
}

export async function generateObjectOpenAI<T extends z.ZodSchema<any>>(
  config: ProviderConfig,
  messages: ChatRequestMessage[],
  options: ObjectGeneratorOptions & {
    schema: T;
    name?: string;
    description?: string;
  }
) {
  const formattedMessages = messages
    .map((m: ChatRequestMessage) => convertCoreMessageToOpenAI(m))
    .filter(Boolean) as { role: string; content: string }[];

  if (!formattedMessages) {
    throw new Error("Failed to format messages");
  }
  const client = new OpenAI({ apiKey: config.apiKey });
  const completion = await client.beta.chat.completions.parse({
    model: config.model,
    messages: formattedMessages as ChatCompletionMessageParam[],
    response_format: zodResponseFormat(options.schema, "event"),
  });
  const responseObject = completion.choices[0].message;

  if (responseObject.parsed) {
    return responseObject.parsed;
  } else if (responseObject.refusal) {
    throw new Error(
      "OpenAI refused to generate object: " + responseObject.refusal
    );
  }
}
