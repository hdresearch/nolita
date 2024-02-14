import { z } from "zod";

export enum BrowserMode {
  vision = "vision",
  text = "text",
}

// ax tree
export type Generic = [number, string, string, AccessibilityTree[]?];
export type Content = string | number;
export type Img = ["img", string];
export type AccessibilityTree = Generic | Content | Img;

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
