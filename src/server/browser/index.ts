import { OpenAPIHono } from "@hono/zod-openapi";

import { createRouter } from "./create";
import { closeRouter } from "./close";

export const browserRouter = new OpenAPIHono();
browserRouter.route("/", createRouter);
browserRouter.route("/", closeRouter);
