import { z } from "zod";
import { ObjectiveState } from "../types/browser/objectiveState.types";
import { backOff } from "exponential-backoff";
import { ModelResponse } from "../types/browser/actionStep.types";
import { chat, completion } from "zod-gpt";
import { Memory } from "../types/memory.types";
import { ChatRequestMessage, CompletionApi } from "llm-api";
// import { CompletionApi } from "./interface";

export function stringifyObjects<T>(obj: T[]): string {
  const strings = obj.map((o) => JSON.stringify(o));
  return strings.join("\n");
}

export class Agent {
  private modelApi: CompletionApi;

  constructor(modelApi: CompletionApi) {
    this.modelApi = modelApi;
  }

  prompt(
    currentState: ObjectiveState,
    memories: Memory[],
    config: any
  ): ChatRequestMessage[] {
    const userPrompt = `Here are examples of a request: 
    ${stringifyObjects(memories)}

    remember to return a result only in the form of an ActionStep.
    Please generate the next ActionStep for ${JSON.stringify({
      objectiveState: currentState,
    })} 
    `;

    let messages: ChatRequestMessage[] = [];

    messages.push({
      role: "user",
      content: userPrompt,
    });

    return messages;
  }

  async call<T extends z.ZodTypeAny>(
    prompt: ChatRequestMessage[],
    opts: { schema: T; autoSlice?: boolean }
  ): Promise<T> {
    const response = await chat(this.modelApi, prompt, opts);

    return response.data;
  }

  async askCommand<T extends ModelResponse>(
    prompt: ChatRequestMessage[],
    outputSchema: z.ZodTypeAny,
    backoffOptions = {
      numOfAttempts: 5, // Maximum number of retries
      startingDelay: 1000, // Initial delay in milliseconds
      timeMultiple: 2, // Multiplier for the delay
      maxDelay: 10000,
    }
  ): Promise<T | undefined> {
    const operation = () => this.call(prompt, { schema: outputSchema });

    try {
      const response = await backOff(operation, backoffOptions);

      return outputSchema.parse(response);
    } catch (error) {
      // Handle the error or rethrow it
      console.log(error);
    }
  }
}
