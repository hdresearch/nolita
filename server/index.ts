import { serve } from "@hono/node-server";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { JsonSchema } from "json-schema-to-zod";
import { swaggerUI } from "@hono/swagger-ui";

import { AgentBrowser } from "../src/agentBrowser";
import { Logger } from "../src/utils";
import { Browser } from "../src/browser";
import { Agent } from "../src/agent/agent";
import { Inventory, InventoryValue } from "../src/inventory";
import { ModelResponseSchema } from "../src/types/browser/actionStep.types";

import { jsonToZod } from "./utils";
import { ErrorSchema, apiSchema } from "./schema";
import { completionApiBuilder } from "../src/agent/config";

export const app = new OpenAPIHono();

const route = createRoute({
  method: "post",
  path: "/browse",
  request: {
    body: {
      content: {
        "application/json": { schema: apiSchema.openapi("RequestBody") },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ModelResponseSchema.extend({
            response_type: z.any().optional(),
          }).openapi("ModelResponse"),
        },
      },
      description: "The response from the agent",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

// TODO: fix the type
// @ts-ignore
app.openapi(route, async (c) => {
  const {
    browse_config,
    provider_config,
    model_config,
    response_type,
    headless,
    inventory,
  } = c.req.valid("json");

  const logger = new Logger("info");
  const chatApi = completionApiBuilder(provider_config, model_config);

  if (!chatApi) {
    return c.json(
      {
        code: 400,
        message: `Failed to create chat api for ${provider_config.provider}`,
      },
      400
    );
  }

  const agent = new Agent(chatApi);
  const browser = await Browser.create(headless);

  // set inventory if it exists
  let agentInventory: Inventory | undefined;
  if (inventory) {
    agentInventory = new Inventory(inventory as InventoryValue[]);
  }

  // set custom response type if it exists
  let responseType = ModelResponseSchema;

  // NOTE THIS IS EXTREMELY DANGEROUS AND ONLY FOR DEMONSTRATION PURPOSES
  // we put some safeguard in place to prevent arbitrary code execution
  if (response_type) {
    responseType = ModelResponseSchema.extend({
      response_type: (await jsonToZod(response_type as JsonSchema)).optional(),
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

  if (answer) {
    return c.json(answer.result, 200);
  }

  return c.json(
    {
      code: 400,
      message: "No response from the agent",
    },
    400
  );
});

app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "HDR Browser API",
  },
});

app.get("/", swaggerUI({ url: "/doc" }));
const port = 3000;

serve({
  fetch: app.fetch,
  port: port,
});

console.log(`Server running on port http://localhost:${port}`);
