import { z } from "lib/zod";

import { ModelResponseSchema } from "./browser/actionStep.types";
import { ObjectiveState } from "./browser";
import { BrowserActionArray } from "./browser/actions.types";

export const Memory = z.object({
  actionStep: ModelResponseSchema(undefined, BrowserActionArray),
  objectiveState: ObjectiveState,
});

export type Memory = z.infer<typeof Memory>;
