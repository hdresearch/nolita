import { GluegunToolbox } from "gluegun"
import { setupServer } from "../../server"
import { serve } from "@hono/node-server"
module.exports = {
    name: 'serve',
    run: async (toolbox: GluegunToolbox) => {
        const { print } = toolbox
        print.info('Starting the server...')
        const app = setupServer()
        serve({
            fetch: app.fetch,
            port: 3000
        })
        print.success('Server started on port 3000')
        return new Promise<void>(resolve => {
            const shutdown = () => {
                print.error(' Shutting down server...')
                // Perform any necessary cleanup here
                resolve();
            };

            process.on('SIGINT', shutdown);
            process.on('SIGTERM', shutdown);
        });

    },
}