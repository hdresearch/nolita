import { z } from "zod";
import { BrowserActionArray } from "./actions.types";
// import { ObjectiveComplete } from "./objectiveComplete.types";

const Click = z.object({
  kind: z.literal("Click").describe("Click on an element"),
  index: z.number().describe("The index of the aria tree"),
});

const Type = z.object({
  kind: z.literal("Type").describe("Type text into an input"),
  index: z
    .number()
    .describe(
      "The index of the elements in the aria tree. This should be an element that you can enter text such as textarea, combobox, textbox, or searchbox"
    ),
  text: z.string().describe("The text to enter"), // input text
});

const Enter = z.object({
  kind: z.literal("Enter"),
  index: z.number(),
});

const Back = z.object({
  kind: z.literal("Back").describe("Go back to the previous page"),
});

const Wait = z.object({
  kind: z.literal("Wait").describe("Wait for a certain amount of time"),
});

export const ObjectiveComplete = z.object({
  kind: z.literal("ObjectiveComplete").describe("Objective is complete"),
  result: z.string().describe("The result of the objective"),
});

export type ObjectiveComplete = z.infer<typeof ObjectiveComplete>;

export const ObjectiveFailed = z.object({
  kind: z.literal("ObjectiveFailed").describe("Objective failed"),
  reason: z.string().describe("The reason the objective failed"),
});

export type ObjectiveFailed = z.infer<typeof ObjectiveFailed>;

export const BrowserActionSchema = z.union([
  Type,
  Click,
  Wait,
  Back,
  // AutoFill,
  // ObjectiveComplete,
]);

export const BrowserActionSchemaArray = z.array(BrowserActionSchema).min(1);

export type BrowserAction = z.infer<typeof BrowserActionSchema>;

export const ActionStep = z.union([
  z.array(BrowserActionSchema).min(1).describe("A list of browser actions"),
  ObjectiveComplete.describe("Objective is complete"),
]);
export type ActionStep = z.infer<typeof ActionStep>;

// schemas and types for the model response
export const ModelResponseSchema = z.object({
  progressAssessment: z.string(),
  command: BrowserActionSchemaArray.optional().describe(
    "List of browser actions"
  ),
  objectiveComplete: ObjectiveComplete.optional().describe(
    "Only return description of result if objective is complete"
  ),
  description: z.string(),
});

export type ModelResponseType = z.infer<typeof ModelResponseSchema>;
