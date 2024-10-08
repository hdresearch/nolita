// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Hono } from "hono"; // this must be left in for setupServer to work
import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";

import { swaggerUI } from "@hono/swagger-ui";
import { pageRouter } from "./pages";
import { browserRouter } from "./browser";

import { browseRouter } from "./browse";

export const setupServer = () => {
  const app = new OpenAPIHono();

  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "HDR Browser API",
    },
  });
  // app.route("/browse", browseRouter);
  app.route("/", pageRouter);
  app.route("/", browserRouter);
  app.route("/", browseRouter);

  app.get("/", swaggerUI({ url: "/doc" }));
  return app;
};

if (require.main === module) {
  const port = 3000;
  const app = setupServer();
  serve({
    fetch: app.fetch,
    port: port,
  });
  console.log(`Server running on port http://localhost:${port}`);
}
