import { z } from "@hono/zod-openapi";

export const PageParamsSchema = z.object({
  browserSession: z.string(),
  pageId: z.string(),
});
