import { z } from "zod";
import { backOff } from "exponential-backoff";

import { CoreMessage, generateText } from "ai";
import { LanguageModelV1 } from "@ai-sdk/provider";

import {
  ModelResponseSchema,
  BrowserActionSchemaArray,
  ObjectiveCompleteResponse,
} from "../types/browser/actionStep.types";
import { Memory } from "../types/memory.types";
import { ObjectiveState } from "../types/browser/objectiveState.types";
import { Inventory } from "../inventory";
import { ObjectiveComplete } from "../types/browser/objectiveComplete.types";
import { generateSchema, SchemaElement } from "./schemaGenerators";
import { debug } from "../utils";
import { generateObject } from "./objectGeneratior";

export type ModelApi = LanguageModelV1;

export function stringifyObjects<T>(obj: T[]): string {
  const strings = obj.map((o) => JSON.stringify(o));
  return strings.join("\n");
}

export interface AgentCallOpts {
  temperature: number;
  maxRetries: number;
}

export class Agent {
  private modelApi: ModelApi;
  systemPrompt?: string;
  maxRetries: number;
  temperature: number;

  constructor(
    agentArgs: { modelApi: ModelApi; systemPrompt?: string },
    opts?: AgentCallOpts
  ) {
    this.modelApi = agentArgs.modelApi;
    this.systemPrompt = agentArgs.systemPrompt;
    this.maxRetries = opts?.maxRetries || 5;
    this.temperature = opts?.temperature || 0;
  }

  /**
   * Generate a prompt for the user to complete an objective
   * @param currentState - The current state of the objective
   * @param memories - The memories to use as examples
   * @param config - Configuration options for the prompt
   * @param config.inventory - The inventory to use for the prompt
   * @param config.systemPrompt - The system prompt to use for the prompt
   * @returns string - The prompt for the user to complete the objective
   */
  prompt(
    currentState: ObjectiveState,
    memories: Memory[],
    config?: { inventory?: Inventory; systemPrompt?: string }
  ): CoreMessage[] {
    const userPrompt = `Here are examples of a request: 
    ${stringifyObjects(memories)}

    Please generate the response for ${JSON.stringify({
      objectiveState: currentState,
    })} 
    `;

    let messages = this.handleConfig(config || {});

    messages.push({
      role: "user",
      content: userPrompt,
    });

    return messages;
  }

  private handleConfig(config: {
    inventory?: Inventory;
    systemPrompt?: string;
  }): CoreMessage[] {
    let messages: CoreMessage[] = [];

    const systemPrompt = config.systemPrompt || this.systemPrompt;
    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    if (config.inventory) {
      messages.push({
        role: "user",
        content: `Use the following information to achieve your objective as needed: ${config.inventory.toString()}`,
      });
    }

    return messages;
  }

  async generateResponseType<
    TObjectiveComplete extends z.AnyZodObject = typeof ObjectiveComplete
  >(
    currentState: ObjectiveState,
    memories: Memory,
    responseSchema: ReturnType<
      typeof ObjectiveCompleteResponse<TObjectiveComplete>
    >,
    opts?: AgentCallOpts
  ) {
    const messages: CoreMessage[] = [
      {
        role: "user",
        content: `
        Here is the past state-action pair: ${JSON.stringify(memories)}
        Please generate the objectiveComplete response for the current state: ${JSON.stringify(
          {
            objectiveState: currentState,
          }
        )}. You may cannot issue commands. All the information you need is in the the current state.`,
      },
    ];

    const response = await generateObject(
      this.modelApi,
      ObjectiveCompleteResponse(responseSchema),
      messages,
      opts
    );

    return ObjectiveCompleteResponse(responseSchema).parse(response);
  }

  async _call<T extends z.ZodSchema<any>>(
    prompt: CoreMessage[],
    commandSchema: T,
    opts?: AgentCallOpts
  ) {
    const response = generateObject(this.modelApi, commandSchema, prompt, opts);

    return response;
  }

  async askCommand<T extends z.ZodSchema<any>>(
    prompt: CoreMessage[],
    schema: T,
    backoffOptions = {
      numOfAttempts: 5, // Maximum number of retries
      startingDelay: 1000, // Initial delay in milliseconds
      timeMultiple: 2, // Multiplier for the delay
      maxDelay: 10000, // Maximum delay
    }
  ) {
    const operation = () => this._call(prompt, schema);

    try {
      const response = await backOff(operation, backoffOptions);

      return schema.parse(response);
    } catch (error) {
      console.log(error);
    }
  }

  async call<
    TObjectiveComplete extends z.AnyZodObject = typeof ObjectiveComplete
  >(
    prompt: CoreMessage[],
    responseSchema: ReturnType<typeof ModelResponseSchema<TObjectiveComplete>>,
    opts?: AgentCallOpts
  ) {
    return this._call(prompt, responseSchema, opts);
  }

  /**  
  Generate a command response from the model and return the parsed data
  @param prompt - The prompt to send to the model
  @param commandSchema - The schema to validate the response
  @param opts - Options for actionCall function
  @param opts.autoSlice - Whether to automatically slice the response
  @param opts.numOfAttempts - Maximum number of retries
  @param opts.startingDelay - Initial delay in milliseconds
  @param opts.timeMultiple - Multiplier for the delay
  @param opts.maxDelay - Maximum delay
  @returns The parsed response data as @commandSchema
  */
  async generateResponse<T extends z.ZodSchema<any>>(
    prompt: CoreMessage[],
    schema: T,
    opts?: AgentCallOpts
  ) {
    return generateObject(this.modelApi, schema, prompt, opts);
  }

  /**
   * Chat with
   * @param prompt
   * @returns The response from the model
   */
  async chat(prompt: string) {
    const messages = this.handleConfig({ systemPrompt: this.systemPrompt });
    messages.push({
      role: "user",
      content: prompt,
    });
    return await generateText({ model: this.modelApi, messages });
  }
}
