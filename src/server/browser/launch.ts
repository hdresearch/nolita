import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";

import { Logger, generateUUID } from "../../utils";

import { AgentSchema } from "../schemas/agentSchemas";
import { ErrorSchema } from "../schema";
import { Browser } from "../../browser";
import { Agent } from "../../agent";
import { BrowserMode } from "../../types";
import { BROWSER_LAUNCH_ARGS } from "../../browser/browserDefaults";
import { Inventory } from "../../inventory";
import { InventoryValue } from "../../inventory/inventory";
import { nolitarc } from "../../utils/config";

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

  const providerConfig = {
    provider,
    apiKey,
    model,
  };

  const inventory = inventoryArgs
    ? new Inventory(
        Object.entries(inventoryArgs).map(
          ([name, value]) => ({ name, value } as InventoryValue)
        )
      )
    : undefined;
  const logger = new Logger(["info"]);

  const modelAgent = new Agent({ providerConfig });
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
