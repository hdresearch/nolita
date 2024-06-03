import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";

import { BROWSERS } from "./create";

const route = createRoute({
  method: "get",
  path: "/{browserSession}/close",
  request: {
    params: z.object({
      browserSession: z.string(),
      pageId: z.string(),
    }),
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
  const { browserSession } = c.req.valid("param");
  const browser = BROWSERS.get(browserSession);

  if (!browser) {
    return c.json({ message: "Browser session not found" }, 400);
  }

  await browser.close();

  return c.json({ message: "Browser closed" });
});
