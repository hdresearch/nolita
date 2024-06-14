import { z } from "zod";
import { backOff } from "exponential-backoff";
import { chat } from "zod-gpt";
import { ChatRequestMessage, CompletionApi } from "llm-api";

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

export function stringifyObjects<T>(obj: T[]): string {
  const strings = obj.map((o) => JSON.stringify(o));
  return strings.join("\n");
}

export class Agent {
  private modelApi: CompletionApi;
  systemPrompt?: string;

  constructor(agentArgs: { modelApi: CompletionApi; systemPrompt?: string }) {
    this.modelApi = agentArgs.modelApi;
    this.systemPrompt = agentArgs.systemPrompt;
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
  ): ChatRequestMessage[] {
    const userPrompt = `Here are examples of a request: 
    ${stringifyObjects(memories)}

    remember to return a result only in the form of an ActionStep.
    Please generate the next ActionStep for ${JSON.stringify({
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
  }): ChatRequestMessage[] {
    let messages: ChatRequestMessage[] = [];

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
    >
  ) {
    const messages: ChatRequestMessage[] = [
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

    const response = await chat(this.modelApi, messages, {
      schema: ObjectiveCompleteResponse(responseSchema),
    });

    return ObjectiveCompleteResponse(responseSchema).parse(response.data);
  }

  async modifyActions(
    currentState: ObjectiveState,
    memory: Memory,
    config?: {
      inventory?: Inventory;
      systemPrompt?: string;
      maxAttempts?: number;
    }
  ) {
    const maxAttempts = config?.maxAttempts || 5;
    const modifyActionsPrompt = `
    
    Here is a past state-action pair: ${JSON.stringify(memory)}

    Please generate the action sequences for ${JSON.stringify(currentState)}
    `;

    let messages = this.handleConfig(config || {});
    messages.push({
      role: "user",
      content: modifyActionsPrompt,
    });

    const commandSchema = generateSchema(
      memory.actionStep.command! as SchemaElement[]
    );

    let safeParseResultSuccess = false;
    let attempts = 0;

    // Retry until the response is valid or the max number of attempts is reached
    if (safeParseResultSuccess == false) {
      let response = await chat(this.modelApi, messages, {
        schema: z.object({
          progressAssessment: z.string(),
          command: BrowserActionSchemaArray,
          description: z.string(),
        }),
        autoSlice: true,
      });

      let safeParseResult = commandSchema.safeParse(response.data.command);
      safeParseResultSuccess = safeParseResult.success;

      while (safeParseResultSuccess == false && attempts <= maxAttempts) {
        debug.log("Invalid response type. Retrying...");
        response = await response.respond(
          `Invalid response type. Error messages: ${JSON.stringify(
            safeParseResult
          )}`
        );
        safeParseResult = commandSchema.safeParse(response.data.command);
        safeParseResultSuccess = safeParseResult.success;
      }
      return ModelResponseSchema().parse(response.data);
    }

    return undefined;
  }

  async _call<T extends z.ZodSchema<any>>(
    prompt: ChatRequestMessage[],
    commandSchema: T,
    opts?: { autoSlice?: boolean }
  ) {
    const response = await chat(this.modelApi, prompt, {
      schema: commandSchema,
      autoSlice: opts?.autoSlice ?? true,
    });

    return response;
  }

  async askCommand<T extends z.ZodSchema<any>>(
    prompt: ChatRequestMessage[],
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

      return schema.parse(response.data);
    } catch (error) {
      console.log(error);
    }
  }

  async call<
    TObjectiveComplete extends z.AnyZodObject = typeof ObjectiveComplete
  >(
    prompt: ChatRequestMessage[],
    responseSchema: ReturnType<typeof ModelResponseSchema<TObjectiveComplete>>,
    opts?: { autoSlice?: boolean }
  ) {
    const response = await chat(this.modelApi, prompt, {
      schema: responseSchema,
      autoSlice: opts?.autoSlice ?? true,
    });

    return response;
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
    prompt: ChatRequestMessage[],
    schema: T,
    opts = {
      autoSlice: true,
      numOfAttempts: 5, // Maximum number of retries
      startingDelay: 1000, // Initial delay in milliseconds
      timeMultiple: 2, // Multiplier for the delay
      maxDelay: 10000, // Maximum delay
    }
  ) {
    const chatResponse = () =>
      chat(this.modelApi, prompt, {
        schema,
        autoSlice: opts.autoSlice,
      });

    try {
      const response = await backOff(chatResponse, opts);

      return schema.parse(response.data);
    } catch (error) {
      console.log(error);
    }
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
    const response = await chat(this.modelApi, messages);

    return response.content;
  }
}
