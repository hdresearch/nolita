import { ObjectiveState } from "../types/browser/browser.types";
import { stateActionPair1, stateActionPair2 } from "./examples";
import { CollectiveMemoryConfig } from "../types";
import { Memory } from "../types/memory.types";
import { debug } from "../utils";

const DEFAULT_STATE_ACTION_PAIRS = [stateActionPair1, stateActionPair2];
// TODO: fill out
export async function remember(
  objectiveState: ObjectiveState,
  config?: CollectiveMemoryConfig,
  limit: number = 2,
  endpoint: string = "https://api.hdr.is/"
) {
  const apiKey = config?.apiKey || process.env.HDR_API_KEY;

  if (!apiKey) {
    return DEFAULT_STATE_ACTION_PAIRS;
  }

  const res = await fetch(`${endpoint}/memories/remember`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      state: objectiveState,
      limit,
    }),
  });

  if (!res.ok) {
    debug.error("Error fetching memories", res.status, await res.text());
    return DEFAULT_STATE_ACTION_PAIRS;
  }

  const memories = await res.json();
  debug.log("Memories", memories);
  return memories.map((m: any) =>
    Memory.parse({
      actionStep: m.action,
      objectiveState: m.state,
    })
  ) as Memory[];
}
