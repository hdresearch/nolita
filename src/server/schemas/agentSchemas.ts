import { z } from "@hono/zod-openapi";

export const AgentSchema = z.object({
  provider: z.string().default("openai").openapi({ example: "openai" }),
  model: z.string().default("gpt-4-32k").openapi({ example: "gpt-4-32k" }),
  apiKey: z.string().openapi({ example: "your-api-key" }),
  temperature: z.number().default(0).openapi({ example: 0 }),
});
