import { z } from "zod";

export const PageMode = z.enum(["aria", "image", "text", "html", "markdown"]);
export type PageMode = z.infer<typeof PageMode>;

export const ObjectiveState = z.object({
  kind: z.literal("ObjectiveState"),
  objective: z.string(),
  progress: z.array(z.string()),
  url: z.string(),
  contentMode: PageMode.default("aria"),
  content: z.string(),
});

export type ObjectiveState = z.infer<typeof ObjectiveState>;

export const ObjectiveComplete = z.object({
  kind: z.literal("ObjectiveComplete"),
  result: z.string(),
});
export type ObjectiveComplete = z.infer<typeof ObjectiveComplete>;
