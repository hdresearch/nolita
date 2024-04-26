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
): Promise<Memory[]> {
  const { apiKey, endpoint } = hdrConfig;

  const body = JSON.stringify({
    state: ObjectiveState.parse(state),
    limit,
  });

  const response = await fetch(`${endpoint}/memories/remember`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(
      `HDR API request failed with status ${response.status} to url ${response.url}`
    );
  }
  const data = await response.json();

  if (data.length === 0) {
    return DEFAULT_STATE_ACTION_PAIRS;
  }

  return data.map((m: any) =>
    Memory.parse({
      actionStep: m.action,
      objectiveState: m.state,
    })
  ) as Memory[];
}

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

export async function fetchMemorySequence(
  sequenceId: string,
  hdrConfig: HDRConfig
) {
  const { apiKey, endpoint } = hdrConfig;

  const response = await fetch(`${endpoint}/memories/sequence/${sequenceId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `HDR API request failed with status ${response.status} to url ${response.url}`
    );
  }

  const data = await response.json();

  return data.map((m: any) =>
    Memory.parse({
      actionStep: m.actionState,
      objectiveState: m.ObjectiveState,
    })
  ) as Memory[];
}

export async function fetchRoute(
  routeParams: { url: string; objective: string },
  hdrConfig: HDRConfig
) {
  const { apiKey, endpoint } = hdrConfig;

  const body = JSON.stringify({
    state: ObjectiveState.parse(routeParams),
  });

  const response = await fetch(`${endpoint}/memories/findpath`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(
      `HDR API request failed with status ${response.status} to url ${response.url}`
    );
  }

  const data = await response.json();

  return { sequenceId: data.sequenceId };
}

export async function findRoute(
  routeParams: { url: string; objective: string },
  hdrConfig: HDRConfig
): Promise<string | undefined> {
  const apiKey = hdrConfig?.apiKey || process.env.HDR_API_KEY;
  if (!apiKey) {
    return undefined;
  }

  try {
    const config = hdrConfig || { apiKey, endpoint: "https://api.hdr.is" };
    return (await fetchRoute(routeParams, config)).sequenceId;
  } catch (error) {
    return undefined;
  }
}
