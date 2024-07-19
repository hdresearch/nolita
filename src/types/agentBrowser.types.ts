import { z } from "@hono/zod-openapi";

export const BrowserBehaviorConfig = z.object({
  goToDelay: z.number().int().default(1000),
  actionDelay: z.number().int().default(100),
  telemetry: z.boolean().default(true),
});

export type BrowserBehaviorConfig = z.infer<typeof BrowserBehaviorConfig>;
