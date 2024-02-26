// taken from https://github.com/dzhng/llm-api/blob/7b7969f25bdae3ee8aa0f4cbe7ec873529a6756d/src/types.ts#L1

import { JsonValue } from "type-fest";
import { EventEmitter } from "events";
import { ClientOptions as OpenAIClientOptions } from "openai";

export type OpenAIConfig = OpenAIClientOptions & {
  modelEndpoint?: string;
  modelDeployment?: string;
  apiVersion?: string;
  isAzure: boolean;
};

export interface ModelConfig {
  model?: string;
  // set this to the total context size of the model, to enable automatic request chunking to avoid context overflows
  contextSize?: number;

  // max tokens to generate
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  logitBias?: Record<string, number>;
  user?: string;

  // use stream mode for API response, the streamed tokens will be sent to `events in `ModelRequestOptions`
  // NOTE: this does NOT support functions
  stream?: boolean;
}

export type ChatRequestRole = "system" | "user" | "assistant" | "tool";

export type ChatContentText = {
  type: "text";
  text: string;
};

export type ChatContentImageURL = {
  type: "image_url";
  image_url: string;
};

export type ChatContentPartial = ChatContentText | ChatContentImageURL;

export interface ChatRequestMessage {
  role: ChatRequestRole;
  content?: ChatContentPartial[];
  toolCall?: ChatRequestToolCall; // used to respond to `assistant` type messages
  toolCallId?: string; // used to respond to `tool` type messages
}

export interface ChatRequestToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export type ModelFunction = {
  name: string;
  parameters: {
    [key: string]: any;
  };
  description?: string;
};

export type ModelRequestOptions = {
  systemMessage?: string | (() => string);

  // send a prefix to the model response so the model can continue generating from there, useful for steering the model towards certain output structures.
  // the response prefix WILL be appended to the model response.
  // for Anthropic's models ONLY
  responsePrefix?: string;

  // stop tokens to use
  stop?: string | string[];

  // function related parameters are for OpenAI's models ONLY
  functions?: ModelFunction[];
  // force the model to call the following function
  callFunction?: string;

  // the number of time to retry this request due to rate limit or recoverable API errors
  retries?: number;
  retryInterval?: number;
  timeout?: number;

  // the minimum amount of tokens to allocate for the response. if the request is predicted to not have enough tokens, it will automatically throw a 'TokenError' without sending the request
  minimumResponseTokens?: number;

  // the maximum amount of tokens to use for response
  // NOTE: in OpenAI models, setting this option also requires contextSize in ModelConfig to be set
  maximumResponseTokens?: number;

  // pass in an event emitter to receive message stream events
  events?: EventEmitter;
};
export type ChatResponse = {
  // the raw message object that was received
  message: ChatRequestMessage;

  content?: string;

  // name and argument used for function reponse
  toolCallId?: string;
  name?: string;
  arguments?: JsonValue;

  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  // function to send another message in the same chat, this will automatically reuse all existing settings, and append a new message to the messages array
  respond: (
    message: string | ChatRequestMessage,
    opt?: ModelRequestOptions
  ) => Promise<ChatResponse>;
};
