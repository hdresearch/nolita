import { z } from "zod";
import { ObjectiveState } from "../types/browser/browser.types";
import { stateActionPair1, stateActionPair2 } from "./examples";

export const HDRConfig = z.object({
  apiKey: z.string().length(1),
});

export type HDRConfig = z.infer<typeof HDRConfig>;

// fill out
export async function remember(
  objectiveState: ObjectiveState,
  hdrConfig?: HDRConfig
) {
  if (!hdrConfig?.apiKey || process.env.HDR_API_KEY) {
    console.warn(
      "No HDR API key provided. This will degrade the performance of your agent."
    );

    return [stateActionPair1, stateActionPair2];
  }
  return [stateActionPair1, stateActionPair2];
}
