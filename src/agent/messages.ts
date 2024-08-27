import { Inventory } from "../inventory";
import { ObjectiveState, StateType } from "../types/browser";
import { Memory } from "../types/memory.types";
import { CoreMessage } from "ai";

/**
 * Stringify an array of objects
 * @param obj - The array of objects to stringify
 * @returns string - The stringified objects
 */
export function stringifyObjects<T>(obj: T[]): string {
  const strings = obj.map((o) => JSON.stringify(o));
  return strings.join("\n");
}

/**
Data content. Can either be a base64-encoded string, a Uint8Array, an ArrayBuffer, or a Buffer.
 */
export type DataContent = string | Uint8Array | ArrayBuffer | Buffer;

/**
 * Chat message image partial
 */
export type ChatMessageImagePartial = {
  type: "image";
  data: URL | DataContent;
};

/**
 * Chat message text partial
 */
export type ChatMessageTextPartial = {
  type: "text";
  data: string;
};

/**
 * Chat message content
 */
export type ChatMessageContent =
  | ChatMessageImagePartial
  | ChatMessageTextPartial;

/**
 * Role of the chat request
 */
export type ChatRequestRole = "system" | "user" | "assistant" | "tool";

/**
 * Chat request message
 */
export type ChatRequestMessage = CoreMessage;

/**
 * Configuration options for the prompt
 * @param mode - The mode of the prompt
 * @param inventory - The inventory to use for the prompt
 * @param systemPrompt - The system prompt to use for the prompt
 * @param memories - The memories to use as examples
 */
export type AgentMessageConfig = {
  mode?: StateType;
  inventory?: Inventory;
  systemPrompt?: string;
  memories?: Memory[];
};

/**
 *
 * @param {AgentMessageConfig} config - Configuration options for the prompt
 * @returns {ChatRequestMessage[]} - The messages to send to the model
 */
export function handleConfigMessages(
  config: AgentMessageConfig
): ChatRequestMessage[] {
  const messages: ChatRequestMessage[] = [];

  const { systemPrompt } = config;

  if (systemPrompt) {
    console.log("systemPrompt", systemPrompt);
    messages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  return messages;
}

/**
 *
 * @param {ObjectiveState} currentState -- The current state of the objective
 * @param {AgentMessageConfig} config -- Configuration options for the prompt
 * @returns {ChatRequestMessage[]} -- The messages to send to the model
 */
export function commandPrompt(
  currentState: ObjectiveState,
  config?: AgentMessageConfig
): ChatRequestMessage[] {
  const messages = handleConfigMessages(config || {});
  const memories = config?.memories;

  if (memories) {
    for (const memory of memories) {
      messages.push({
        role: "user",
        content: `Here are examples of a previous request: 
            ${JSON.stringify(memory)}
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

/**
 *
 * @param {string} state - The current state of the page
 * @param config -- Configuration options for the prompt
 * @returns {ChatRequestMessage[]} -- The messages to send to the model
 */
export function getPrompt(
  state: string,
  config?: AgentMessageConfig
): ChatRequestMessage[] {
  const mode = config?.mode || "aria";
  const messages = handleConfigMessages(config || {});

  messages.push({
    role: "user",
    content: `Here is the current ${mode} of the page: ${state}`,
  });

  return messages;
}
