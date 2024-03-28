import { z } from "zod";
import { ObjectiveState } from "../types/browser/browser.types";
import { stateActionPair1, stateActionPair2 } from "./examples";

export const HDRConfig = z.object({
  apiKey: z.string(),
  endpoint: z.string().url().default("https://api.hdr.is"),
});

export type HDRConfig = z.infer<typeof HDRConfig>;

// TODO: fill out
export async function remember(
  objectiveState: ObjectiveState,
  hdrConfig?: HDRConfig
) {
  if (!hdrConfig?.apiKey || process.env.HDR_API_KEY) {
    return [stateActionPair1, stateActionPair2];
  }
  return [stateActionPair1, stateActionPair2];
}
