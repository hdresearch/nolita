import { OpenAPIHono } from "@hono/zod-openapi";

import { doRouter } from "./do";
import { getRouter } from "./get";
import { newPageRouter } from "./newPage";
import { ListRouter } from "./list";
import { closeRouter } from "./close";
import { infoRouter } from "./info";
import { screenshotRouter } from "./screenshot";
import { contentRouter } from "./content";
import { stepRouter } from "./step";
import { browseRouter } from "./browse";

export const pageRouter = new OpenAPIHono();

pageRouter.route("/", doRouter);
pageRouter.route("/", getRouter);
pageRouter.route("/", newPageRouter);
pageRouter.route("/", ListRouter);
pageRouter.route("/", closeRouter);
pageRouter.route("/", infoRouter);
pageRouter.route("/", screenshotRouter);
pageRouter.route("/", contentRouter);
pageRouter.route("/", stepRouter);
pageRouter.route("/", browseRouter);
