import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { JsonSchema } from "json-schema-to-zod";

import { BROWSERS } from "../browser/launch.js";
import { PageParamsSchema } from "../schemas/index.js";
import { Inventory, InventoryValue } from "../../inventory/index.js";
import { jsonToZod } from "../utils.js";

const route = createRoute({
  method: "post",
  path: "/{browserSession}/page/{pageId}/browse",
  request: {
    params: PageParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: z.object({
            command: z
              .string()
              .openapi({ example: "Find all the email addresses on the page" }),
            schema: z.any().optional().openapi({}),
            maxTurns: z.number().default(20).openapi({ example: 20 }),
            inventory: z
              .record(z.string(), z.string())
              .optional()
              .openapi({
                example: { name: "YOUR NAME", creditCard: "555555555555" },
              }),
          }),
        },
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
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Returns an error",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Returns an error",
    },
  },
});

export const browseRouter = new OpenAPIHono();

browseRouter.openapi(route, async (c) => {
  const { browserSession, pageId } = c.req.valid("param");
  const browser = BROWSERS.get(browserSession);

  if (!browser) {
    return c.json({ message: "Browser session not found" }, 400);
  }

  const page = browser.pages.get(pageId);

  if (!page) {
    return c.json({ message: "Page not found" }, 400);
  }

  const {
    command,
    schema,
    maxTurns,
    inventory: inventoryArgs,
  } = c.req.valid("json");

  let responseSchema: z.ZodObject<any> | undefined;
  if (schema) {
    responseSchema = await jsonToZod(schema as JsonSchema);
  }

  const inventory = inventoryArgs
    ? new Inventory(
        Object.entries(inventoryArgs).map(
          ([name, value]) => ({ name, value } as InventoryValue)
        )
      )
    : undefined;

  const result = await page.browse(command, {
    schema: responseSchema,
    maxTurns,
    inventory,
  });

  return c.json(result);
});
