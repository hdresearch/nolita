import { Argv } from 'yargs';
import { setupServer } from '../../server';
import { serve } from '@hono/node-server';

export const command = 'serve';
export const desc = 'Start the server';

export const builder = (yargs: Argv) => {
  return yargs.option('port', {
    describe: 'Port to run the server on',
    type: 'number',
    default: 3000,
  })
};

export const handler = async (argv: any) => {
  const { port } = argv;
  console.log('Starting the server...');
  const app = setupServer();
  serve({
    fetch: app.fetch,
    port: port,
  });
  console.log(`Server started on port ${port}`);
  console.log(`Documentation available at http://localhost:${port}/`);
  console.log('Press Ctrl+C to stop the server.');

  return new Promise<void>((resolve) => {
    const shutdown = () => {
      console.error(' Shutting down server...');
      // Perform any necessary cleanup here
      resolve();
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });
};