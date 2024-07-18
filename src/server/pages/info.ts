import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "lib/zod"

import { BROWSERS } from "../browser/launch";
import { PageParamsSchema } from "../schemas";

const PageInfoReturnSchema = z.object({
  id: z.string().openapi({ example: "pageId" }),
  url: z.string().openapi({ example: "https://example.com" }),
  title: z.string().openapi({ example: "Example Domain" }),
});

const route = createRoute({
  method: "get",
  path: "/{browserSession}/page/{pageId}",
  request: {
    params: PageParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PageInfoReturnSchema,
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

export const infoRouter = new OpenAPIHono();

infoRouter.openapi(route, async (c) => {
  const { browserSession, pageId } = c.req.valid("param");
  const browser = BROWSERS.get(browserSession);

  if (!browser) {
    return c.json({ message: "Browser session not found" }, 400);
  }

  const page = browser.pages.get(pageId);

  if (!page) {
    return c.json({ message: "Page not found" }, 400);
  }

  return c.json({
    id: page.pageId,
    url: page.url(),
    title: await page.title(),
    progress: page.progress,
  }, 200);
});
