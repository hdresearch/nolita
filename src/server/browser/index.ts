import { OpenAPIHono } from "@hono/zod-openapi";

import { launchRouter } from "./launch";
import { closeRouter } from "./close";

export const browserRouter = new OpenAPIHono();

browserRouter.route("/browser", launchRouter);
browserRouter.route("/browser", closeRouter);
