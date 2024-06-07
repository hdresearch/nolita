import { z } from "zod";

export const PageParamsSchema = z.object({
  browserSession: z.string(),
  pageId: z.string(),
});
