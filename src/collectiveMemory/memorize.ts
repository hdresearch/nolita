import { ModelResponseType } from "../types/browser/actionStep.types";
import { ObjectiveState } from "../types/browser/browser.types";
import {
  CollectiveMemoryConfig,
  CollectiveMemoryConfigSchema,
} from "../types/collectiveMemory/index";

import { debug } from "../utils";

export async function memorize(
  state: ObjectiveState,
  action: ModelResponseType,
  collectiveMemoryConfig: CollectiveMemoryConfig = CollectiveMemoryConfigSchema.parse(
    {}
  )
) {
  const config = CollectiveMemoryConfigSchema.parse(collectiveMemoryConfig);
  const endpoint = `${config.endpoint}/memory/memorize`;

  let headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.apiKey) {
    headers = {
      ...headers,
      authorization: config.apiKey,
    };
  }
  const resp = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      actionStep: action,
      objectiveState: state,
    }),
  });

  debug.log("Memorize status", resp.status);
}
