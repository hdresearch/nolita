import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { OpenAIChatApi } from "llm-api";
import { JsonSchema } from "json-schema-to-zod";

import { AgentBrowser } from "../src/agentBrowser";
import { Logger } from "../src/utils";
import { Browser } from "../src/browser";
import { Agent } from "../src/agent/agent";
import { Inventory, InventoryValue } from "../src/inventory";
import { jsonToZod } from "./utils";

import { ModelResponseSchema } from "../src/types/browser/actionStep.types";

const browseSchema = z.object({
  startUrl: z.string().url(),
  objective: z.array(z.string()),
  maxIterations: z.number().int().default(20),
});

const agentSchema = z.object({
  apiKey: z.string().default(process.env.OPENAI_API_KEY!),
  model: z.string().default("gpt-4"),
});

const InventorySchema = z.array(
  z.object({
    name: z.string(),
    value: z.string(),
    type: z.union([z.literal("string"), z.literal("number")]),
  })
);

// types to handle arbitrary json output
const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);

const apiSchema = z.object({
  browse_config: browseSchema,
  agent_confg: agentSchema,
  response_type: jsonSchema.optional(),
  inventory: InventorySchema.optional(),
  headless: z.boolean().default(true),
});

const app = new Hono();

app.post("/api", zValidator("json", apiSchema), async (c) => {
  const { browse_config, agent_confg, response_type, headless, inventory } =
    c.req.valid("json");

  const logger = new Logger("info");
  const openAIChatApi = new OpenAIChatApi(
    {
      apiKey: agent_confg.apiKey,
    },
    { model: agent_confg.model }
  );
  const agent = new Agent(openAIChatApi);
  const browser = await Browser.create(headless);

  // set inventory if it exists
  let agentInventory: Inventory | undefined;
  if (inventory) {
    agentInventory = new Inventory(inventory as InventoryValue[]);
  }

  // set custom response type if it exists
  let responseType = ModelResponseSchema;

  // NOTE THIS IS EXTREMELY DANGEROUS AND ONLY FOR DEMONSTRATION PURPOSES
  if (response_type) {
    responseType = ModelResponseSchema.extend({
      answer: (
        (await jsonToZod(response_type as JsonSchema)) as z.ZodAny
      ).optional(),
    });
  }

  const agentBrowser = new AgentBrowser(agent, browser, logger, agentInventory);

  const answer = await agentBrowser.browse(
    {
      startUrl: browse_config.startUrl,
      objective: browse_config.objective,
      maxIterations: browse_config.maxIterations,
    },
    responseType
  );

  await agentBrowser.close();

  return c.json(answer?.result);
});

const port = 3000;

serve({
  fetch: app.fetch,
  port: port,
});
