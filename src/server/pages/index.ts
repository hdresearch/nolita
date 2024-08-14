import { OpenAPIHono } from "@hono/zod-openapi";

import { doRouter } from "./do.js";
import { getRouter } from "./get.js";
import { newPageRouter } from "./newPage.js";
import { ListRouter } from "./list.js";
import { closeRouter } from "./close.js";
import { infoRouter } from "./info.js";
import { screenshotRouter } from "./screenshot.js";
import { contentRouter } from "./content.js";
import { stepRouter } from "./step.js";
import { browseRouter } from "./browse.js";
import { gotoRouter } from "./goto.js";

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
pageRouter.route("/", gotoRouter);
