import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "lib/zod"

import { BROWSERS } from "../browser/launch";
import { PageParamsSchema } from "../schemas";
import { ObjectiveState } from "../../types/browser";
import { objectiveStateExample1 } from "../../collectiveMemory/examples";
import { Inventory } from "../../inventory";
import { InventoryValue } from "../../inventory/inventory";

const doRequestSchema = z.object({
  command: z.string().openapi({ example: "Click on the login button" }),
  inventory: z
    .record(z.string(), z.string())
    .optional()
    .openapi({ example: { name: "YOUR NAME", creditCard: "555555555555" } }),
  delay: z.number().optional().openapi({ example: 100 }),
});

const route = createRoute({
  method: "post",
  path: "/{browserSession}/page/{pageId}/do",
  request: {
    params: PageParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: doRequestSchema.openapi("RequestBody"),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ObjectiveState.openapi({ example: objectiveStateExample1 }),
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
  },
});

export const doRouter = new OpenAPIHono();

doRouter.openapi(route, async (c) => {
  const { browserSession, pageId } = c.req.valid("param");
  const { command, inventory: inventoryArgs, delay } = c.req.valid("json");
  const browser = BROWSERS.get(browserSession);

  if (!browser) {
    return c.json({ message: "Browser session not found" }, 400);
  }

  const page = browser.pages.get(pageId);

  if (!page) {
    return c.json({ message: "Page not found" }, 400);
  }

  const inventory = inventoryArgs
    ? new Inventory(
        Object.entries(inventoryArgs).map(
          ([name, value]) => ({ name, value } as InventoryValue)
        )
      )
    : undefined;

  await page.do(command, { inventory, delay });

  return c.json(await page.state(command, page.progress), 200);
});
