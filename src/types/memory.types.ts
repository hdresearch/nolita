import { z } from "zod";

import { ModelResponse } from "./browser/actionStep.types";
import { ObjectiveState } from "./browser/browser.types";

export const Memory = z.object({
  actionStep: ModelResponse,
  objectiveState: ObjectiveState,
});

export type Memory = z.infer<typeof Memory>;
