import { z } from "../../lib/zod";

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
