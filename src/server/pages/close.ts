import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "lib/zod"

import { BROWSERS } from "../browser/launch";
import { PageParamsSchema } from "../schemas";

const route = createRoute({
  method: "get",
  path: "/{browserSession}/page/{pageId}/close",
  request: {
    params: PageParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
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

export const closeRouter = new OpenAPIHono();

closeRouter.openapi(route, async (c) => {
  const { browserSession, pageId } = c.req.valid("param");
  const browser = BROWSERS.get(browserSession);

  if (!browser) {
    return c.json({ message: "Browser session not found" }, 400);
  }

  const page = browser.pages.get(pageId);

  if (!page) {
    return c.json({ message: "Page not found" }, 400);
  }

  await page.close();

  return c.json({ message: "Page closed", id: pageId });
});
