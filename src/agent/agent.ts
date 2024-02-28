import { z } from "zod";
import { ObjectiveState } from "../types/browser/objectiveState.types";
import { backOff } from "exponential-backoff";
import {
  ModelResponseSchema,
  ModelResponseType,
} from "../types/browser/actionStep.types";
import { chat, completion } from "zod-gpt";
import { Memory } from "../types/memory.types";
import { ChatRequestMessage, CompletionApi } from "llm-api";

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

  async call<T extends z.ZodType<ModelResponseType>>(
    prompt: ChatRequestMessage[],
    responseSchema: T
    // opts: { schema: ModelResponse; autoSlice?: boolean }
  ) {
    const response = await chat(this.modelApi, prompt, {
      schema: responseSchema,
    });

    return response;
  }

  async askCommand<T extends z.ZodType<ModelResponseType>>(
    prompt: ChatRequestMessage[],
    outputSchema: T,
    backoffOptions = {
      numOfAttempts: 5, // Maximum number of retries
      startingDelay: 1000, // Initial delay in milliseconds
      timeMultiple: 2, // Multiplier for the delay
      maxDelay: 10000,
    }
  ) {
    const operation = () => this.call(prompt, outputSchema);

    try {
      const response = await backOff(operation, backoffOptions);

      return response.data;
    } catch (error) {
      // Handle the error or rethrow it
      console.log(error);
    }
  }
}
