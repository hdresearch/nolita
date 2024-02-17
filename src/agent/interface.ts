import { z } from "zod";
import { ObjectiveState } from "../types/browser.types";

// export abstract class Agent {
//   modelAPI: string;

//   abstract getCommand<T>(
//     objectiveState: ObjectiveState,
//     responseType: T,
//     autoSlice: boolean
//   ): Promise<T>;
// }

export const ModelConfig = z.object({
  model: z.string(),
  contextWindow: z.number().int().min(1),
});

export type ModelConfig = z.infer<typeof ModelConfig>;

export interface AgentInterface {
  modelAPI: string;
  modelConfig: ModelConfig;

  getCommand<T>(
    objectiveState: ObjectiveState,
    responseType: T,
    autoSlice: boolean
  ): Promise<T>;

  name(): string;

  config(): ModelConfig;
}
