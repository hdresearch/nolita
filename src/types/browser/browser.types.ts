import { z } from "zod";

export enum BrowserMode {
  vision = "vision",
  text = "text",
}

export const BrowserArgs = z.object({
  mode: z.nativeEnum(BrowserMode),
  headless: z.boolean().default(true),
  userAgent: z.string().optional(),
  browserWSEndpoint: z.string().optional(),
});

export type BrowserArgs = z.infer<typeof BrowserArgs>;

export const BrowserObjective = z.object({
  startUrl: z.string().default("https://google.com/?hl=en"),
  objective: z.array(z.string()),
  maxIterations: z.number().default(10),
});

export type BrowserObjective = z.infer<typeof BrowserObjective>;

// ax tree
export type Generic = [number, string, string, AccessibilityTree[]?];
export type Content = string | number;
export type Img = ["img", string];
export type AccessibilityTree = Generic | Content | Img;
