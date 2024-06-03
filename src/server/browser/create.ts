import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";

import { Logger, generateUUID } from "../../utils";

import { AgentSchema } from "../schemas/agentSchemas";
import { ErrorSchema } from "../schema";
import { Browser } from "../../browser";
import { Agent, completionApiBuilder } from "../../agent";
import { BrowserMode } from "../../types";
import { BROWSER_LAUNCH_ARGS } from "../../browser/browserDefaults";
import { Inventory } from "../../inventory";
import { InventoryValue } from "../../inventory/inventory";

const BrowerSessionSchema = z.object({
  agent: AgentSchema,
  headless: z.boolean().default(true).openapi({ example: true }),
  wsEndpoint: z.string().optional().openapi({ example: "ws://localhost:3000" }),
  launchArgs: z
    .array(z.string())
    .default(BROWSER_LAUNCH_ARGS)
    .openapi({ example: ["--no-sandbox"] }),
  mode: z
    .nativeEnum(BrowserMode)
    .default(BrowserMode.text)
    .openapi({ example: BrowserMode.text }),
  inventory: z
    .record(z.string(), z.string())
    .optional()
    .openapi({ example: { name: "YOUR NAME", creditCard: "555555555555" } }),
});

export const BROWSERS = new Map<string, Browser>();

const route = createRoute({
  method: "post",
  path: "/session/create",
  request: {
    body: {
      content: {
        "application/json": {
          schema: BrowerSessionSchema.openapi("RequestBody"),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            sessionId: z.string().openapi({ example: generateUUID() }),
          }),
        },
      },
      description: "The id for the browser session",
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

export const createRouter = new OpenAPIHono();

createRouter.openapi(route, async (c) => {
  const {
    agent: agentArgs,
    inventory: inventoryArgs,
    mode,
    wsEndpoint,
    launchArgs,
    headless,
  } = c.req.valid("json");
  const chatApi = completionApiBuilder(
    { provider: agentArgs.provider, apiKey: agentArgs.apiKey },
    { model: agentArgs.model, temperature: agentArgs.temperature }
  );

  if (!chatApi) {
    return c.json(
      {
        code: 400,
        message: `Failed to create chat api for ${agentArgs.provider}`,
      },
      400
    );
  }

  const inventory = inventoryArgs
    ? new Inventory(
        Object.entries(inventoryArgs).map(
          ([name, value]) => ({ name, value } as InventoryValue)
        )
      )
    : undefined;
  const logger = new Logger(["info"]);

  const modelAgent = new Agent({ modelApi: chatApi });
  const browser = await Browser.launch(headless, modelAgent, logger, {
    inventory,
    mode,
    browserWSEndpoint: wsEndpoint,
    browserLaunchArgs: launchArgs,
  });

  const sessionId = generateUUID();
  BROWSERS.set(sessionId, browser);
  return c.json({ sessionId });
});
