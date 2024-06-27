import { ModelResponseType } from "../types/browser/actionStep.types";
import { ObjectiveState } from "../types/browser";
import { CollectiveMemoryConfig } from "../types/collectiveMemory/index";
import { debug } from "../utils";

export async function memorize(
  state: ObjectiveState,
  action: ModelResponseType,
  sequenceId: string,
  collectiveMemoryConfig?: CollectiveMemoryConfig
) {
  const endpointValue =
    process.env.HDR_ENDPOINT! ??
    collectiveMemoryConfig?.endpoint ??
    "https://api.hdr.is";

  const apiKey = collectiveMemoryConfig?.apiKey ?? process.env.HDR_API_KEY;
  const endpoint = `${endpointValue}/memorize`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  };

  const resp = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      sequence_id: sequenceId,
      memory: {
        state,
        action,
      },
    }),
  });

  debug.log("Memorize status", resp.status);

  if (resp.status !== 200) {
    debug.log("Memorize failed", await resp.text());
    return false;
  }

  return true;
}
