import { z } from "lib/zod";

export const PageParamsSchema = z.object({
  browserSession: z.string(),
  pageId: z.string(),
});
