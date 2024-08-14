import { OpenAPIHono } from "@hono/zod-openapi";

import { launchRouter } from "./launch.js";
import { closeRouter } from "./close.js";

export const browserRouter = new OpenAPIHono();

browserRouter.route("/browser", launchRouter);
browserRouter.route("/browser", closeRouter);
