export type ObjectGeneratorMode =
  | "TOOLS"
  | "JSON"
  | "MD_JSON"
  | "JSON_SCHEMA"
  | "FUNCTIONS";

export type ObjectGeneratorOptions = {
  model: string;
  objectMode: ObjectGeneratorMode;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  maxRetries?: number;
  logger?: <T extends unknown[]>(level: string, ...args: T) => void;
};
