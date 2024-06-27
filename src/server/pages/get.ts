import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";

import { BROWSERS } from "../browser/launch";
import { JsonSchema } from "json-schema-to-zod";
import { jsonToZod } from "../utils";

const route = createRoute({
  method: "post",
  path: "/{browserSession}/page/{pageId}/get",
  request: {
    params: z.object({
      browserSession: z.string(),
      pageId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            command: z
              .string()
              .openapi({ example: "Find all the email addresses on the page" }),
            schema: z.any().optional().openapi({}),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.any(),
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

export const getRouter = new OpenAPIHono();

getRouter.openapi(route, async (c) => {
  const { browserSession, pageId } = c.req.valid("param");
  const browser = BROWSERS.get(browserSession);

  if (!browser) {
    return c.json({ message: "Browser session not found" }, 400);
  }

  const page = browser.pages.get(pageId);

  if (!page) {
    return c.json({ message: "Page not found" }, 400);
  }

  const { schema, command } = c.req.valid("json");

  let responseSchema: z.ZodType<any, z.ZodTypeDef, any> | undefined;
  if (schema) {
    responseSchema = await jsonToZod(schema as JsonSchema);
    if (!responseSchema) {
      return c.json({ message: "Invalid schema" }, 400);
    }
  }

  const result: any = await page.get(command, responseSchema);
  return c.json(result);
});
