import { z } from "zod";

export const browseSchema = z.object({
  startUrl: z.string().url().openapi({ example: "https://google.com" }),
  objective: z
    .array(z.string())
    .openapi({ example: ["what is the most active game on steam?"] }),
  maxIterations: z.number().int().default(20).openapi({ example: 10 }),
});

export const providerSchema = z.object({
  provider: z.string().openapi({ example: "openai" }),
  apiKey: z
    .string()
    .default(process.env.OPENAI_API_KEY!)
    .openapi({ example: "your-api-key" }),
});

export const modelSchema = z.object({
  model: z.string().openapi({ example: "gpt-4" }),
  temperature: z.number().optional().openapi({ example: 0 }),
});

export const InventorySchema = z.array(
  z.object({
    name: z.string().openapi({ example: "Username" }),
    value: z.string().openapi({ example: "tdaly" }),
    type: z
      .union([z.literal("string"), z.literal("number")])
      .openapi({ example: "string" }),
  })
);

// types to handle arbitrary json output
const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
export const jsonSchema: z.ZodType<Json> = z
  .lazy(() =>
    z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
  )
  .openapi({
    example: {
      type: "object",
      properties: {
        hello: {
          type: "string",
        },
      },
    },
  });

export const apiSchema = z
  .object({
    browse_config: browseSchema,
    provider_config: providerSchema,
    model_config: modelSchema,
    response_type: z
      .any()
      .optional()
      .openapi({
        example: {
          type: "object",
          properties: {
            numberOfActiveUsers: {
              type: "number",
              required: true,
              description: "The number of active users",
            },
          },
        },
      }),
    inventory: InventorySchema.optional(),
    headless: z.boolean().default(true),
  })
  .openapi("ApiSchema");

export const ErrorSchema = z.object({
  code: z.number().openapi({
    example: 400,
  }),
  message: z.string().openapi({
    example: "Bad Request",
  }),
});
