import { z } from "zod";
import { ChatRequestMessage, CompletionApi } from "llm-api";
import { Inventory } from "../inventory";
import { ObjectiveState, StateType } from "../types/browser";
import { Memory } from "../types/memory.types";

export function stringifyObjects<T>(obj: T[]): string {
  const strings = obj.map((o) => JSON.stringify(o));
  return strings.join("\n");
}

export type AgentMessageConfig = {
  mode?: StateType;
  inventory?: Inventory;
  systemPrompt?: string;
  memories?: Memory[];
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
  config?: AgentMessageConfig
): ChatRequestMessage[] {
  let messages = handleConfigMessages(config || {});
  const memories = config?.memories;

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

  messages.push({
    role: "user",
    content: `Remember to return a result only in the form of an ActionStep.
    Please generate the next ActionStep for ${JSON.stringify({
      objectiveState: currentState,
    })} 
    `,
  });

  return messages;
}

export function getPrompt(
  state: string,
  config?: AgentMessageConfig
): ChatRequestMessage[] {
  const mode = config?.mode || "aria";
  let messages = handleConfigMessages(config || {});

  messages.push({
    role: "user",
    content: `Here is the current ${mode} of the page: ${state}`,
  });

  return messages;
}
