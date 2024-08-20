import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { JsonSchema } from "json-schema-to-zod";

import { Logger } from "../utils";
import { Browser } from "../browser";
import { Inventory, InventoryValue } from "../inventory";

import { jsonToZod } from "./utils";
import { ErrorSchema, apiSchema } from "./schema";
import { nolitarc } from "../utils/config";

export const browseRouter = new OpenAPIHono();

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
          schema: z.any(),
        },
      },
      description: "The response from the server",
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

browseRouter.openapi(route, async (c) => {
  const { browse_config, response_type, headless, inventory } =
    c.req.valid("json");
  const { hdrApiKey, agentProvider, agentApiKey, agentModel } = nolitarc();

  const logger = new Logger(["info"]);
  if (!agentProvider) {
    return c.json({
      code: 400,
      message:
        "No agent provider found. Please use `npx nolita auth` to set a config.",
    });
  }
  const providerConfig = {
    provider: agentProvider,
    apiKey: agentApiKey,
    model: agentModel,
  };
  const _inventory = inventory
    ? new Inventory(
        Object.entries(inventory).map(
          ([name, value]) => ({ name, value } as InventoryValue)
        )
      )
    : undefined;

  const browser = await Browser.launch(headless, providerConfig, logger, {
    apiKey: hdrApiKey,
    endpoint: "https://api.hdr.is",
    inventory: _inventory,
  });

  let responseSchema: z.ZodObject<any> | undefined;
  if (response_type) {
    responseSchema = await jsonToZod(response_type as JsonSchema);
  }

  const page = await browser.newPage();
  const answer = await page.browse(browse_config.objective[0], {
    schema: responseSchema,
    maxTurns: browse_config.maxIterations,
  });
  await browser.close();

  if (answer) {
    return c.json(answer, 200);
  }

  return c.json(
    {
      code: 400,
      message: "No response from the agent",
    },
    400
  );
});
