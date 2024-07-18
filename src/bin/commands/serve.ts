import { GluegunToolbox } from "gluegun";
import { setupServer } from "../../server";
import { serve } from "@hono/node-server";

module.exports = {
  name: "serve",
  run: async (toolbox: GluegunToolbox) => {
    const { print } = toolbox;
    const { port } = toolbox.parameters.options;
    print.info("Starting the server...");
    const app = setupServer();
    serve({
      fetch: app.fetch,
      port: port || 3000,
    });
    print.success(`Server started on port ${port || 3000}`);
    print.info(
      `Documentation available at http://localhost:${port || 3000}/doc`,
    );
    print.info("Press Ctrl+C to stop the server.");
    return new Promise<void>((resolve) => {
      const shutdown = () => {
        print.error(" Shutting down server...");
        // Perform any necessary cleanup here
        resolve();
      };

      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    });
  },
};
