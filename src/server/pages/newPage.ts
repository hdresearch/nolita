import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";

import { BROWSERS } from "../browser/launch";

const route = createRoute({
  method: "get",
  path: "/{browserSession}/page/newPage",
  request: {
    params: z.object({
      browserSession: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ pageId: z.string() }),
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

export const newPageRouter = new OpenAPIHono();

newPageRouter.openapi(route, async (c) => {
  const { browserSession } = c.req.valid("param");
  const browser = BROWSERS.get(browserSession);

  if (!browser) {
    return c.json({ message: "Browser session not found" }, 400);
  }

  const page = await browser.newPage();

  return c.json({ pageId: page.pageId }, 200);
});
