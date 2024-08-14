import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";

import { Logger, generateUUID } from "../../utils/index.js";

import { AgentSchema } from "../schemas/agentSchemas.js";
import { ErrorSchema } from "../schema.js";
import { Browser } from "../../browser/index.js";
import { Agent, completionApiBuilder } from "../../agent/index.js";
import { BrowserMode } from "../../types/index.js";
import { BROWSER_LAUNCH_ARGS } from "../../browser/browserDefaults.js";
import { Inventory } from "../../inventory/index.js";
import { InventoryValue } from "../../inventory/inventory.js";
import { nolitarc } from "../../utils/config.js";

const BrowerSessionSchema = z.object({
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
  agent: AgentSchema.optional(),
});

export const BROWSERS = new Map<string, Browser>();

const route = createRoute({
  method: "post",
  path: "/session/launch",
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

export const launchRouter = new OpenAPIHono();

launchRouter.openapi(route, async (c) => {
  const {
    agent: agentArgs,
    inventory: inventoryArgs,
    mode,
    wsEndpoint,
    launchArgs,
    headless,
  } = c.req.valid("json");
  const { agentApiKey, agentProvider, agentModel, hdrApiKey } = nolitarc();
  const provider = agentArgs?.provider ?? agentProvider;
  const apiKey = agentArgs?.apiKey ?? agentApiKey;
  const model = agentArgs?.model ?? agentModel;
  if (!provider) {
    return c.json(
      {
        code: 400,
        message:
          "No agent provider specified. Please use `npx nolita auth` to set a config or pass it directly.",
      },
      400
    );
  }

  if (!apiKey) {
    return c.json(
      {
        code: 400,
        message:
          "No agent API key specified. Please use `npx nolita auth` to set a config or pass it directly.",
      },
      400
    );
  }

  if (!model) {
    return c.json(
      {
        code: 400,
        message:
          "No agent model specified. Please use `npx nolita auth` to set a config or pass it directly.",
      },
      400
    );
  }

  const chatApi = completionApiBuilder(
    {
      provider,
      apiKey: agentArgs?.apiKey ?? agentApiKey,
    },
    { model: agentArgs?.model ?? agentModel, objectMode: "TOOLS" }
  );

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
    ...(hdrApiKey && { apiKey: hdrApiKey }),
  });

  const sessionId = generateUUID();
  BROWSERS.set(sessionId, browser);
  return c.json({ sessionId });
});
