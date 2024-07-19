import { z } from "@hono/zod-openapi";
import {
  ModelResponseSchema,
  BrowserActionSchemaArray,
  ObjectiveCompleteResponse,
} from "../types/browser/actionStep.types";
import { Memory } from "../types/memory.types";
import { ObjectiveState } from "../types/browser/objectiveState.types";
import { Inventory } from "../inventory";
import { generateSchema, SchemaElement } from "./schemaGenerators";
import { debug } from "../utils";
import { completionApiBuilder } from "./config";
import { nolitarc } from "../utils/config";
import { handleConfigMessages, ChatRequestMessage } from "./messages";
import { ModelConfig, AgentConfig } from "./config";
import { generateObject } from "./generators";

export function stringifyObjects<T>(obj: T[]): string {
  const strings = obj.map((o) => JSON.stringify(o));
  return strings.join("\n");
}

export class Agent {
  private client: any;
  private objectGeneratorOptions: ModelConfig;

  systemPrompt?: string;

  constructor(agentArgs: {
    modelApi?: ModelConfig & AgentConfig;
    systemPrompt?: string;
  }) {
    if (agentArgs.modelApi) {
      this.client = agentArgs.modelApi.client;
      this.objectGeneratorOptions = agentArgs.modelApi;
      this.systemPrompt = agentArgs.systemPrompt;
    } else {
      try {
        const { agentApiKey, agentProvider, agentModel } = nolitarc();
        const savedAgentArgs = completionApiBuilder(
          { provider: agentProvider, apiKey: agentApiKey },
          { model: agentModel, objectMode: "TOOLS" },
        );
        this.client = savedAgentArgs.client;
        this.objectGeneratorOptions = {
          model: agentModel,
          objectMode: "TOOLS",
        };
      } catch (error) {
        throw new Error("Failed to create chat api");
      }
    }
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
    config?: { inventory?: Inventory; systemPrompt?: string },
  ): ChatRequestMessage[] {
    const userPrompt = `
    ${config?.inventory ? `Use the following information to achieve your objective as needed: ${config?.inventory.toString()}` : ""}
    Here are examples of a request: 
    ${stringifyObjects(memories)}

    remember to return a result only in the form of an ActionStep.
    Please generate the next ActionStep for ${JSON.stringify({
      objectiveState: currentState,
    })} 
    `;

    const messages = handleConfigMessages(config || {});

    messages.push({
      role: "user",
      content: userPrompt,
    });

    return messages;
  }

  async generateResponseType<T extends z.ZodObject<any>>(
    currentState: ObjectiveState,
    memories: Memory,
    responseSchema: T,
  ): Promise<z.infer<T>> {
    const messages: ChatRequestMessage[] = [
      {
        role: "user",
        content: `
        Here is the past state-action pair: ${JSON.stringify(memories)}
        Please generate the objectiveComplete response for the current state: ${JSON.stringify(
          {
            objectiveState: currentState,
          },
        )}. You may cannot issue commands. All the information you need is in the the current state.`,
      },
    ];

    const response = await generateObject(this.client, messages, {
      schema: responseSchema,
      ...this.objectGeneratorOptions,
      name: "ObjectiveComplete",
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
    },
  ) {
    const maxAttempts = config?.maxAttempts || 5;
    const modifyActionsPrompt = `
    
    Here is a past state-action pair: ${JSON.stringify(memory)}

    Please generate the action sequences for ${JSON.stringify(currentState)}
    `;

    const messages = handleConfigMessages(config || {});
    messages.push({
      role: "user",
      content: modifyActionsPrompt,
    });

    const commandSchema = generateSchema(
      memory.actionStep.command! as SchemaElement[],
    );

    let safeParseResultSuccess = false;
    const attempts = 0;

    // Retry until the response is valid or the max number of attempts is reached
    if (safeParseResultSuccess == false) {
      let response = await generateObject(this.client, messages, {
        schema: z.object({
          progressAssessment: z.string(),
          command: BrowserActionSchemaArray,
          description: z.string(),
        }),
        ...this.objectGeneratorOptions,
        name: "ActionStep",
      });

      let safeParseResult = commandSchema.safeParse(response.command);
      safeParseResultSuccess = safeParseResult.success;

      while (safeParseResultSuccess == false && attempts <= maxAttempts) {
        debug.log("Invalid response type. Retrying...");
        response = await response.respond(
          `Invalid response type. Error messages: ${JSON.stringify(
            safeParseResult,
          )}`,
        );
        safeParseResult = commandSchema.safeParse(response.command);
        safeParseResultSuccess = safeParseResult.success;
      }
      return ModelResponseSchema().parse(response);
    }

    return undefined;
  }

  async askCommand<T extends z.ZodSchema<any>>(
    prompt: ChatRequestMessage[],
    schema: T,
    opts = {
      numOfAttempts: 5, // Maximum number of retries
      startingDelay: 1000, // Initial delay in milliseconds
      timeMultiple: 2, // Multiplier for the delay
      maxDelay: 10000, // Maximum delay
    },
  ) {
    const response = await generateObject(this.client, prompt, {
      schema: schema,
      ...this.objectGeneratorOptions,
      name: "GenerateActionStep",
      ...opts,
    });

    return response;
  }

  async call<T extends z.ZodSchema<any>>(
    prompt: ChatRequestMessage[],
    responseSchema: T,
    opts?: { autoSlice?: boolean },
  ): Promise<T> {
    const response = await generateObject(this.client, prompt, {
      schema: responseSchema,
      ...this.objectGeneratorOptions,
      name: "GenerateActionStep",
      ...opts,
    });

    return responseSchema.parse(response);
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
  async actionCall<T extends z.ZodSchema<any>>(
    prompt: ChatRequestMessage[],
    commandSchema: T,
    opts = {
      autoSlice: true,
      numOfAttempts: 5, // Maximum number of retries
      startingDelay: 1000, // Initial delay in milliseconds
      timeMultiple: 2, // Multiplier for the delay
      maxDelay: 10000, // Maximum delay
    },
  ) {
    const chatResponse = await generateObject(this.client, prompt, {
      ...this.objectGeneratorOptions,
      schema: commandSchema,
      name: "GenerateActionStep",
      maxRetries: opts.numOfAttempts,
    });
    return commandSchema.parse(chatResponse);
  }

  /**  
  Get information from the model and return the parsed data
  @param prompt - The prompt to send to the model
  @param responseSchema - The schema to validate the response
  @param opts - Options for actionCall function
  @param opts.autoSlice - Whether to automatically slice the response
  @param opts.numOfAttempts - Maximum number of retries
  @param opts.startingDelay - Initial delay in milliseconds
  @param opts.timeMultiple - Multiplier for the delay
  @param opts.maxDelay - Maximum delay
  @returns The parsed response data as @responseSchema
  */
  async returnCall<T extends z.ZodSchema<any>>(
    prompt: ChatRequestMessage[],
    responseSchema: T,
    opts = {
      autoSlice: true,
      numOfAttempts: 5, // Maximum number of retries
      startingDelay: 1000, // Initial delay in milliseconds
      timeMultiple: 2, // Multiplier for the delay
      maxDelay: 10000, // Maximum delay
    },
  ): Promise<z.infer<T>> {
    const chatResponse = await this.call(prompt, responseSchema, opts);
    return responseSchema.parse(chatResponse);
  }

  /**
   * Chat with
   * @param prompt
   * @returns The response from the model
   */
  async chat(prompt: string) {
    const messages = handleConfigMessages({ systemPrompt: this.systemPrompt });
    messages.push({
      role: "user",
      content: prompt,
    });
    const response = await generateObject(this.client, messages, {
      ...this.objectGeneratorOptions,
      schema: z.object({ content: z.string() }).describe("ChatResponse"),
      name: "Chat",
    });

    return response.content;
  }
}

export function makeAgent(
  prodiverOpts?: { provider: string; apiKey: string },
  modelConfig?: Partial<ModelConfig>,
  customProvider?: { path: string },
  opts?: { systemPrompt?: string },
) {
  if (!prodiverOpts) {
    const { agentApiKey, agentProvider, agentModel } = nolitarc();
    prodiverOpts = { provider: agentProvider, apiKey: agentApiKey };
    modelConfig = { model: agentModel, objectMode: "TOOLS" };
  }
  if (!prodiverOpts.provider) {
    throw new Error("Provider is required");
  }
  if (!modelConfig?.model) {
    throw new Error("Model is required");
  }
  const chatApi = completionApiBuilder(
    prodiverOpts,
    modelConfig,
    customProvider,
  );

  if (!chatApi) {
    throw new Error(`Failed to create chat api for ${prodiverOpts.provider}`);
  }

  return new Agent({
    modelApi: chatApi,
    systemPrompt: opts?.systemPrompt,
  });
}

export function defaultAgent() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "You must set OPENAI_API_KEY in your environment to use the default agent.",
    );
  }
  return makeAgent(
    { provider: "openai", apiKey },
    { model: "gpt-4", objectMode: "TOOLS" },
  );
}
