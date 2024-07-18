import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "../../lib/zod";
import { JsonSchema } from "json-schema-to-zod";

import { BROWSERS } from "../browser/launch";
import { PageParamsSchema } from "../schemas";
import { jsonToZod } from "../utils";
import { Inventory, InventoryValue } from "../../inventory";
import { ObjectiveState } from "../../types/browser";

const route = createRoute({
  method: "post",
  path: "/{browserSession}/page/{pageId}/step",
  request: {
    params: PageParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: z.object({
            command: z
              .string()
              .openapi({ example: "Click on the login button" }),
            schema: z.any().optional().openapi({}),
            opts: z
              .object({
                delay: z.number().optional().openapi({ example: 100 }),
                inventory: z.record(z.string(), z.string()).optional(),
              })
              .optional()
              .openapi({
                example: {
                  delay: 100,
                  inventory: { name: "YOUR NAME", creditCard: "555555555555" },
                },
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
          schema: z.object({
            result: z.any().optional(),
            state: ObjectiveState,
          }),
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

export const stepRouter = new OpenAPIHono();

stepRouter.openapi(route, async (c) => {
  const { browserSession, pageId } = c.req.valid("param");
  const browser = BROWSERS.get(browserSession);

  if (!browser) {
    return c.json({ message: "Browser session not found" }, 400);
  }

  const page = browser.pages.get(pageId);

  if (!page) {
    return c.json({ message: "Page not found" }, 400);
  }

  const { schema, command, opts: userOpts } = c.req.valid("json");

  let responseSchema: z.ZodObject<any> | undefined;
  if (schema) {
    responseSchema = await jsonToZod(schema as JsonSchema);
  }

  let inventory: Inventory | undefined;

  if (userOpts?.inventory) {
    inventory = new Inventory(
      Object.entries(userOpts.inventory).map(
        ([name, value]) => ({ name, value }) as InventoryValue,
      ),
    );
  }

  const opts = {
    delay: userOpts?.delay,
    inventory,
  };

  const step = await page.step(command, responseSchema, opts);

  return c.json(
    {
      result: step,
      state: await page.state(command, page.progress),
    },
    200,
  );
});
