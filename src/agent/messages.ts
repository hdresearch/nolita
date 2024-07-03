import { z } from "zod";
import { ChatRequestMessage, CompletionApi } from "llm-api";
import { Inventory } from "../inventory";
import { ObjectiveState } from "../types/browser";
import { Memory } from "../types/memory.types";

export function stringifyObjects<T>(obj: T[]): string {
  const strings = obj.map((o) => JSON.stringify(o));
  return strings.join("\n");
}

export type AgentMessageConfig = {
  inventory?: Inventory;
  systemPrompt?: string;
};

export function handleConfigMessages(
  config: AgentMessageConfig
): ChatRequestMessage[] {
  let messages: ChatRequestMessage[] = [];

  const { systemPrompt, inventory } = config;

  if (systemPrompt) {
    console.log("systemPrompt", systemPrompt);
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  if (inventory) {
    console.log("inventory", inventory);
    messages.push({
      role: "user",
      content: `Use the following information to achieve your objective as needed: ${inventory.toString()}`,
    });
  }

  return messages;
}

export function commandPrompt(
  currentState: ObjectiveState,
  memories?: Memory[],
  config?: AgentMessageConfig
): ChatRequestMessage[] {
  let messages = handleConfigMessages(config || {});

  if (memories) {
    for (const memory of memories) {
      messages.push({
        role: "user",
        content: `Here are examples of a previous request: 
            ${JSON.stringify(memory)}
        
            remember to return a result only in the form of an ActionStep.

            `,
      });
    }
  }

  const userPrompt = `Remember to return a result only in the form of an ActionStep.
    Please generate the next ActionStep for ${JSON.stringify({
      objectiveState: currentState,
    })} 
    `;

  messages.push({
    role: "user",
    content: userPrompt,
  });

  return messages;
}
