import { z } from "lib/zod";

export const StateType = z.enum(["html", "text", "markdown", "image", "aria"]);
export type StateType = z.infer<typeof StateType>;

export const ObjectiveState = z.object({
  kind: z.literal("ObjectiveState"),
  objective: z.string(),
  progress: z.array(z.string()),
  url: z.string(),
  ariaTree: z.string(),
});

export type ObjectiveState = z.infer<typeof ObjectiveState>;

export type ObjectiveComplete = {
  kind: "ObjectiveComplete";
  result: string;
};
