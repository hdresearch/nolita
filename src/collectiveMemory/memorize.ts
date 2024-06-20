import { ModelResponseType } from "../types/browser/actionStep.types";
import { ObjectiveState } from "../types/browser/browser.types";
import { CollectiveMemoryConfig } from "../types/collectiveMemory/index";
import { debug } from "../utils";

export async function memorize(
  state: ObjectiveState,
  action: ModelResponseType,
  sequenceId: string,
  collectiveMemoryConfig?: CollectiveMemoryConfig
) {
  const config = CollectiveMemoryConfig.parse(collectiveMemoryConfig);
  const endpoint = `${config.endpoint}/memorize`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
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
