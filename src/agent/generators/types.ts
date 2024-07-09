/**
 * The mode for the object generator
 */
export type ObjectGeneratorMode =
  | "TOOLS"
  | "JSON"
  | "MD_JSON"
  | "JSON_SCHEMA"
  | "FUNCTIONS";

/**
 * The options for the object generator
 * @param model The model to use for the object generation
 * @param objectMode The object mode to use for the object generation
 * @param maxTokens The maximum number of tokens
 * @param temperature The temperature for the model
 * @param topP The topP for the model
 * @param maxRetries The maximum number of retries
 * @param logger The logger for the object generator
 */
export type ObjectGeneratorOptions = {
  model: string;
  objectMode: ObjectGeneratorMode;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  maxRetries?: number;
  logger?: <T extends unknown[]>(level: string, ...args: T) => void;
};

export type DefaultObjectGeneratorOptions = {
  objectMode: 'TOOLS';
};
