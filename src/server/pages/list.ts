import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";

import { BROWSERS } from "../browser/launch";

const ListResponseItem = z.object({
  id: z.string(),
  url: z.string().url(),
  title: z.string(),
  progress: z.array(z.string()).optional(),
});

const ListResponseSchema = z.array(ListResponseItem);

const route = createRoute({
  method: "get",
  path: "/{browserSession}/pages",
  request: {
    params: z.object({
      browserSession: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ListResponseSchema,
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

export const ListRouter = new OpenAPIHono();

ListRouter.openapi(route, async (c) => {
  const { browserSession } = c.req.valid("param");
  const browser = BROWSERS.get(browserSession);

  if (!browser) {
    return c.json({ message: "Browser session not found" }, 400);
  }

  const pages = await browser.pages.forEach((page, id) => {
    return ListResponseItem.parse({
      id: page.pageId,
      url: page.url(),
      title: page.title(),
      progress: page.progress,
    });
  });

  return c.json(ListResponseSchema.parse(pages));
});
