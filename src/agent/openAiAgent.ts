import { z } from "zod";
import { ModelConfig } from "./interface";

export const OpenAiModelConfig = z.extend(ModelConfig, {
  apiKey: z.string(),
});
