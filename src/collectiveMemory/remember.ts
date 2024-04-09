import { z } from "zod";
import { ObjectiveState } from "../types/browser/browser.types";
import { DEFAULT_STATE_ACTION_PAIRS } from "./examples";
import { Memory } from "../types/memory.types";

export const HDRConfig = z.object({
  apiKey: z.string(),
  endpoint: z.string().url().default("https://api.hdr.is"),
});

export type HDRConfig = z.infer<typeof HDRConfig>;

export async function fetchStateActionPairs(
  state: ObjectiveState,
  hdrConfig: HDRConfig,
  limit: number = 2
) {
  const { apiKey, endpoint } = hdrConfig;

  const response = await fetch(`${endpoint}/memories/remember`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      state: ObjectiveState.parse(state),
      limit,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `HDR API request failed with status ${response.status} to url ${response.url}`
    );
  }
  const data = await response.json();

  return data.map((m: any) =>
    Memory.parse({
      actionStep: m.action,
      objectiveState: m.state,
    })
  ) as Memory[];
}

// TODO: fill out
export async function remember(
  objectiveState: ObjectiveState,
  hdrConfig?: HDRConfig,
  limit: number = 2
): Promise<Memory[]> {
  const apiKey = hdrConfig?.apiKey || process.env.HDR_API_KEY;
  if (!apiKey) {
    return DEFAULT_STATE_ACTION_PAIRS;
  }
  try {
    const config = hdrConfig || { apiKey, endpoint: "https://api.hdr.is" };
    return await fetchStateActionPairs(objectiveState, config, limit);
  } catch (error) {
    console.error("Error calling HDR API:", error);
    return DEFAULT_STATE_ACTION_PAIRS;
  }
}
