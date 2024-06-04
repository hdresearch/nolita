import { OpenAPIHono } from "@hono/zod-openapi";

import { createRouter } from "./create";
import { closeRouter } from "./close";

export const browserRouter = new OpenAPIHono();
browserRouter.route("/browser", createRouter);
browserRouter.route("/browser", closeRouter);
