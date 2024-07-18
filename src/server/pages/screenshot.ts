import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "lib/zod"

import { BROWSERS } from "../browser/launch";
import { PageParamsSchema } from "../schemas";

const route = createRoute({
  method: "get",
  path: "/{browserSession}/page/{pageId}/screenshot/{type}",
  request: {
    params: PageParamsSchema.extend({ type: z.enum(["base64", "dataUrl"]) }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ image: z.string() }),
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

export const screenshotRouter = new OpenAPIHono();

screenshotRouter.openapi(route, async (c) => {
  const { browserSession, pageId, type } = c.req.valid("param");
  const browser = BROWSERS.get(browserSession);

  if (!browser) {
    return c.json({ message: "Browser session not found" }, 400);
  }

  const page = browser.pages.get(pageId);

  if (!page) {
    return c.json({ message: "Page not found" }, 400);
  }

  const screenshot = await page.screenshot();

  let image: string;

  if (type === "base64") {
    image = screenshot.toString("base64");
  } else if (type === "dataUrl") {
    image = `data:image/png;base64,${screenshot.toString("base64")}`;
  } else {
    return c.json({ message: "Invalid image type" }, 400);
  }

  if (!image) {
    return c.json({ message: "Failed to take screenshot" }, 500);
  }

  return c.json({ image }, 200);
});
