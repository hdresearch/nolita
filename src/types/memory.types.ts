import { z } from "zod";

import { ModelResponseSchema } from "./browser/actionStep.types.js";
import { ObjectiveState } from "./browser/index.js";
import { BrowserActionArray } from "./browser/actions.types.js";

export const Memory = z.object({
  actionStep: ModelResponseSchema(undefined, BrowserActionArray),
  objectiveState: ObjectiveState,
});

export type Memory = z.infer<typeof Memory>;
