import { OpenAPIHono } from "@hono/zod-openapi";

import { doRouter } from "./do";
import { getRouter } from "./get";
import { newPageRouter } from "./newPage";
import { ListRouter } from "./list";
import { closeRouter } from "./close";

export const pageRouter = new OpenAPIHono();

pageRouter.route("/", doRouter);
pageRouter.route("/", getRouter);
pageRouter.route("/", newPageRouter);
pageRouter.route("/", ListRouter);
pageRouter.route("/", closeRouter);
