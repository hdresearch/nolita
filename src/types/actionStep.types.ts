import { z } from "zod";
import { BrowserActionArray } from "./actions.types";
import { ObjectiveComplete } from "./objectiveComplete.types";

export const ActionStep = z.union([
  BrowserActionArray,
  ObjectiveComplete.describe("Objective is complete"),
]);
export type ActionStep = z.infer<typeof ActionStep>;

// schemas and types for the model response
export const ModelResponse = z.object({
  progressAssessment: z.string(),
  command: BrowserActionArray.optional().describe("List of browser actions"),
  objectiveComplete: ObjectiveComplete.optional().describe(
    "Only return description of result if objective is complete"
  ),
  description: z.string(),
});

export type ModelResponse = z.infer<typeof ModelResponse>;
