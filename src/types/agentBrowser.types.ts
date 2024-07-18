import { z } from "lib/zod"

export const BrowserBehaviorConfig = z.object({
  goToDelay: z.number().int().default(1000),
  actionDelay: z.number().int().default(100),
  telemetry: z.boolean().default(true),
});

export type BrowserBehaviorConfig = z.infer<typeof BrowserBehaviorConfig>;
