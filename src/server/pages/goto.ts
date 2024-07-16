import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";

import { BROWSERS } from "../browser/launch";
import { PageParamsSchema } from "../schemas";

const goToRequestSchema = z.object({
  url: z.string().url().openapi({ example: "https://example.com" }),
});

const route = createRoute({
  method: "post",
  path: "/{browserSession}/page/{pageId}/goto",
  request: {
    params: PageParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: goToRequestSchema.openapi("RequestBody"),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string(), url: z.string().url() }),
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

export const gotoRouter = new OpenAPIHono();

gotoRouter.openapi(route, async (c) => {
  const { browserSession, pageId } = c.req.valid("param");
  const browser = BROWSERS.get(browserSession);

  if (!browser) {
    return c.json({ message: "Browser session not found" }, 400);
  }

  const page = browser.pages.get(pageId);

  if (!page) {
    return c.json({ message: "Page not found" }, 400);
  }

  const { url } = c.req.valid("json");

  await page.goto(url);

  return c.json({ message: `Navigating to page`, url: page.url() });
});
