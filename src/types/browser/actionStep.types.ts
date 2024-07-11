import { z } from "zod";

import { Click, Wait, Back, Type } from "./actions.types";

/**
 * BrowserActionSchema -- The basic actions a model can take on a page
 */
export const BrowserActionSchema = z.union([Type, Click, Wait, Back]);
export type BrowserActionSchema = z.infer<typeof BrowserActionSchema>;

/**
 * BrowserActionSchemaArray -- An array of BrowserActionSchema with min one element
 */
export const BrowserActionSchemaArray = z.array(BrowserActionSchema).min(1);
export type BrowserActionSchemaArray = z.infer<typeof BrowserActionSchemaArray>;

/**
 * ObjectiveComplete -- Objective is complete
 */
export const ObjectiveComplete = z.object({
  kind: z.literal("ObjectiveComplete").describe("Objective is complete"),
  result: z.string().describe("The result of the objective"),
});

export type ObjectiveComplete = z.infer<typeof ObjectiveComplete>;

/**
 * ObjectiveFailed -- Objective failed
 * @param reason - The reason the objective failed
 * @returns ObjectiveFailed
 */
export const ObjectiveFailed = z.object({
  kind: z.literal("ObjectiveFailed").describe("Objective failed"),
  reason: z.string().describe("The reason the objective failed"),
});

export type ObjectiveFailed = z.infer<typeof ObjectiveFailed>;

export const ActionStep = z.union([
  z.array(BrowserActionSchema).min(1).describe("A list of browser actions"),
  ObjectiveComplete.describe("Objective is complete"),
]);
export type ActionStep = z.infer<typeof ActionStep>;

export const ModelResponse = z.object({
  progressAssessment: z.string(),
  command: BrowserActionSchemaArray.optional().describe(
    "List of browser actions"
  ),
  objectiveComplete: ObjectiveComplete.optional().describe(
    "Only return description of result if objective is complete"
  ),
  description: z.string(),
});

export const ModelResponseSchema = <TObjectiveComplete extends z.AnyZodObject>(
  objectiveCompleteExtension?: TObjectiveComplete,
  commandSchema: z.ZodSchema<any> = BrowserActionSchemaArray
) =>
  z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("ObjectiveComplete"),
      progressAssessment: z.string(),
      description: z.string(),
      objectiveComplete: objectiveCompleteExtension
        ? ObjectiveComplete.merge(objectiveCompleteExtension)
            .optional()
            .describe(
              "Only return description of result if objective is complete"
            )
        : ObjectiveComplete.optional().describe(
            "Only return description of result if objective is complete"
          ),
    }),
    z.object({
      kind: z.literal("Command"),
      progressAssessment: z.string(),
      description: z.string(),
      command: commandSchema.optional().describe("List of browser actions"),
    }),
  ]);

export type ModelResponseType<
  TObjectiveComplete extends z.AnyZodObject = typeof ObjectiveComplete
> = z.infer<ReturnType<typeof ModelResponseSchema<TObjectiveComplete>>>;

export const ObjectiveCompleteResponse = <T extends z.AnyZodObject>(
  extension?: T
) =>
  z.object({
    progressAssessment: z.string(),
    objectiveComplete: extension
      ? extension.describe(
          "Only return description of result if objective is complete"
        )
      : ObjectiveComplete.describe(
          "Only return description of result if objective is complete"
        ),
    description: z.string(),
  });

export type ObjectiveCompleteResponse<
  TObjectiveComplete extends z.AnyZodObject
> = z.infer<ReturnType<typeof ObjectiveCompleteResponse<TObjectiveComplete>>>;

// Function to merge a ZodObject into objectiveComplete within ModelResponse with a default empty schema
export const extendModelResponse = <T extends z.ZodObject<any>>(
  additionalSchema: T = z.object({}) as T
) => {
  const updatedObjectiveComplete = ObjectiveComplete.merge(additionalSchema)
    .optional()
    .describe("Updated ObjectiveComplete with additional properties");
  return ModelResponse.extend({ objectiveComplete: updatedObjectiveComplete });
};
