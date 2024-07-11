import { z } from "zod";

import { ModelResponseSchema } from "./browser/actionStep.types";
import { ObjectiveState } from "./browser";
import { BrowserActionArray } from "./browser/actions.types";

export const Memory = z.object({
  actionStep: ModelResponseSchema(z.object({}), BrowserActionArray),
  objectiveState: ObjectiveState,
});

export type Memory = z.infer<typeof Memory>;
