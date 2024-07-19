import { z } from "@hono/zod-openapi";
import { URL } from "url";

import { ObjectiveState } from "../types/browser";
import { DEFAULT_STATE_ACTION_PAIRS } from "./examples";
import { Memory } from "../types/memory.types";
import { debug } from "../utils";

export const HDRConfig = z.object({
  apiKey: z.string().optional(),
  endpoint: z.string().url().optional().default("https://api.hdr.is"),
});

export type HDRConfig = z.infer<typeof HDRConfig>;

export async function fetchStateActionPairs(
  state: ObjectiveState,
  requestId: string,
  opts?: { apiKey?: string; endpoint?: string; limit?: number },
): Promise<Memory[]> {
  const endpoint =
    opts?.endpoint ?? process.env.HDR_ENDPOINT ?? "https://api.hdr.is";
  const limit = opts?.limit || 2;
  const apiKey = opts?.apiKey || process.env.HDR_API_KEY;
  if (!apiKey) {
    throw new Error("No HDR API key provided");
  }
  if (!endpoint) {
    throw new Error("No HDR API endpoint provided");
  }
  const body = JSON.stringify({
    state: ObjectiveState.parse(state),
    requestId,
    limit,
  });

  const rememberEndpoint = new URL("/memories/remember", endpoint);
  const response = await fetch(rememberEndpoint.href, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(
      `HDR API request failed with status ${response.status} to url ${response.url}`,
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
    }),
  ) as Memory[];
}

export async function remember(
  objectiveState: ObjectiveState,
  requestId: string,
  opts?: { apiKey?: string; endpoint?: string; limit?: number },
): Promise<Memory[]> {
  try {
    const memories = await fetchStateActionPairs(
      objectiveState,
      requestId,
      opts,
    );
    const filteredMemories = memories.filter(
      (memory) => memory.actionStep.command !== undefined,
    );
    if (filteredMemories.length === 0) {
      return DEFAULT_STATE_ACTION_PAIRS;
    }
    return filteredMemories;
  } catch (error) {
    debug.write(`Error calling HDR API: ${error}`);
    return DEFAULT_STATE_ACTION_PAIRS;
  }
}

export async function fetchMemorySequence(
  sequenceId: string,
  opts?: { apiKey?: string; endpoint?: string },
) {
  const { apiKey, endpoint } = opts
    ? opts
    : { apiKey: process.env.HDR_API_KEY, endpoint: process.env.HDR_ENDPOINT };

  if (!apiKey) {
    throw new Error("No HDR API key provided");
  }
  if (!endpoint) {
    throw new Error("No HDR API endpoint provided");
  }

  const baseUrl = new URL(`/memories/sequence/${sequenceId}`, endpoint);

  const response = await fetch(baseUrl.href, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `HDR API request failed with status ${response.status} to url ${response.url}`,
    );
  }

  const data = await response.json();

  return data.map((m: any) =>
    Memory.parse({
      actionStep: m.actionState,
      objectiveState: m.ObjectiveState,
    }),
  ) as Memory[];
}

export async function fetchRoute(
  routeParams: { url: string; objective: string },
  opts?: { apiKey?: string; endpoint?: string },
) {
  const { apiKey, endpoint } = opts!;

  const baseUrl = new URL(`/memories/findpath`, endpoint);

  const response = await fetch(baseUrl.href, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url: routeParams.url,
      objective: routeParams.objective,
    }),
  });

  if (!response.ok) {
    console.error("Error calling HDR API:", await response.text());
    throw new Error(
      `HDR API request failed with status ${response.status} to url ${response.url}`,
    );
  }

  const data = await response.json();

  return data;
}

export async function findRoute(
  routeParams: { url: string; objective: string },
  opts?: { apiKey?: string; endpoint?: string },
): Promise<Memory[] | undefined> {
  const { apiKey, endpoint } = opts
    ? opts
    : { apiKey: process.env.HDR_API_KEY, endpoint: process.env.HDR_ENDPOINT };
  if (!apiKey) {
    return undefined;
  }

  try {
    const route = await fetchRoute(routeParams, { apiKey, endpoint });

    return route.map((m: any) => {
      return Memory.parse({
        actionStep: m.actionState,
        objectiveState: m.ObjectiveState,
      });
    });
  } catch (error) {
    return undefined;
  }
}
