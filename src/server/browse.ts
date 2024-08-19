import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { JsonSchema } from "json-schema-to-zod";

import { AgentBrowser } from "../agentBrowser";
import { Logger } from "../utils";
import { Browser } from "../browser";
import { Inventory } from "../inventory";
import { ModelResponseSchema, ObjectiveComplete } from "../types";

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
          schema: ObjectiveComplete.extend({
            response_type: z.any().optional(),
          }).openapi("ObjectiveComplete"),
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
// @ts-expect-error need to fix this type for the compiler but it works
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

  const browser = await Browser.launch(headless, providerConfig);

  // set inventory if it exists
  let agentInventory: Inventory | undefined;
  if (inventory) {
    agentInventory = new Inventory(inventory);
  }

  // set custom response type if it exists
  let responseType = ObjectiveComplete;

  // NOTE THIS IS EXTREMELY DANGEROUS AND ONLY FOR DEMONSTRATION PURPOSES
  // we put some safeguard in place to prevent arbitrary code execution

  if (response_type) {
    responseType = ObjectiveComplete.extend({
      response_type: await jsonToZod(response_type as JsonSchema),
    });
  }

  let collectiveMemoryConfig = undefined;
  if (hdrApiKey) {
    collectiveMemoryConfig = {
      apiKey: hdrApiKey,
      endpoint: "https://api.hdr.is",
    };
  }

  const args = {
    agent: providerConfig,
    browser: browser,
    logger: logger,
    inventory: agentInventory,
    collectiveMemoryConfig: collectiveMemoryConfig,
  };

  const agentBrowser = new AgentBrowser(args);

  const answer = await agentBrowser.browse(
    {
      startUrl: browse_config.startUrl,
      objective: browse_config.objective,
      maxIterations: browse_config.maxIterations,
    },
    ModelResponseSchema(responseType)
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
