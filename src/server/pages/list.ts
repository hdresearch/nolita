import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";

import { BROWSERS } from "../browser/launch.js";

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

  const pages: z.infer<typeof ListResponseItem>[] = [];
  for (const [id, page] of browser.pages) {
    pages.push({
      id,
      url: page.url(),
      title: await page.title(),
      progress: page.progress,
    });
  }

  console.log("PAGES", pages);

  return c.json(pages);
});
