// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Hono } from "hono"; // this must be left in for setupServer to work
import { serve } from "@hono/node-server";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "../lib/zod";
import { JsonSchema } from "json-schema-to-zod";
import { swaggerUI } from "@hono/swagger-ui";

import { AgentBrowser } from "../agentBrowser";
import { Logger } from "../utils";
import { Browser } from "../browser";
import { Agent } from "../agent/agent";
import { Inventory } from "../inventory";
import { ModelResponseSchema, ObjectiveComplete } from "../types";

import { jsonToZod } from "./utils";
import { ErrorSchema, apiSchema } from "./schema";
import { completionApiBuilder } from "../agent";
import { pageRouter } from "./pages";
import { browserRouter } from "./browser";
import { nolitarc } from "../utils/config";

export const setupServer = () => {
  const app = new OpenAPIHono();
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
  app.openapi(route, async (c) => {
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
    const chatApi = completionApiBuilder(
      {
        provider: agentProvider,
        apiKey: agentApiKey,
      },
      {
        model: agentModel,
        objectMode: "TOOLS",
      },
    );

    const agent = new Agent({ modelApi: chatApi });
    const browser = await Browser.launch(headless, agent);

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
      agent: agent,
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
      ModelResponseSchema(responseType),
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
      400,
    );
  });

  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "HDR Browser API",
    },
  });
  app.route("/", pageRouter);
  app.route("/", browserRouter);

  app.get("/", swaggerUI({ url: "/doc" }));
  return app;
};

if (require.main === module) {
  const port = 3000;
  const app = setupServer();
  serve({
    fetch: app.fetch,
    port: port,
  });
  console.log(`Server running on port http://localhost:${port}`);
}
