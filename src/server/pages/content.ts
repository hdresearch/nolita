import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";

import { BROWSERS } from "../browser/launch";
import { PageParamsSchema } from "../schemas";

const PageContentTypeSchema = z
  .enum(["markdown", "html", "text"])
  .openapi({ example: "markdown" });

const PageContentReturnSchema = z.object({
  pageContent: z.string().openapi({ example: "Hello, world!" }),
  type: PageContentTypeSchema,
  url: z.string().openapi({ example: "https://example.com/" }),
});

const route = createRoute({
  method: "get",
  path: "/{browserSession}/page/{pageId}/content/{type}",
  request: {
    params: PageParamsSchema.extend({ type: PageContentTypeSchema }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PageContentReturnSchema,
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

export const contentRouter = new OpenAPIHono();

contentRouter.openapi(route, async (c) => {
  const { browserSession, pageId, type } = c.req.valid("param");
  const browser = BROWSERS.get(browserSession);

  if (!browser) {
    return c.json({ message: "Browser session not found" }, 400);
  }

  const page = browser.pages.get(pageId);

  if (!page) {
    return c.json({ message: "Page not found" }, 400);
  }

  let content: string | undefined;

  if (type === "markdown") {
    content = await page.markdown();
  } else if (type === "html") {
    content = await page.html();
  } else if (type === "text") {
    content = await page.content();
  } else {
    return c.json({ message: "Invalid page content type" }, 400);
  }

  if (!content) {
    return c.json({ message: "Error retrieving page content" }, 500);
  }

  return c.json(
    PageContentReturnSchema.parse({
      pageContent: content,
      type: type,
      url: page.url(),
    })
  );
});
