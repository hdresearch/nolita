import { z } from "zod";
import { ObjectiveState } from "../types/browser/browser.types";

export const HDRConfig = z.object({
  apiKey: z.string().length(1),
});

export type HDRConfig = z.infer<typeof HDRConfig>;

// fill out
export async function remember(objectiveState: ObjectiveState) {}
