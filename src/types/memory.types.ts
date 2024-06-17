import { z } from "zod";

import { ModelResponseSchema } from "./browser/actionStep.types";
import { ObjectiveState } from "./browser";

export const Memory = z.object({
  actionStep: ModelResponseSchema(),
  objectiveState: ObjectiveState,
});

export type Memory = z.infer<typeof Memory>;
