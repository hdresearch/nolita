#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { run as defaultRun } from './run.js';
import { run as authRun } from './commands/auth.js';
import * as createCommand from './commands/create.js';
import * as serveCommand from './commands/serve.js';

yargs(hideBin(process.argv))
  .command('$0', 'Run the default Nolita command', {}, defaultRun)
  .command('auth', 'Authenticate and configure Nolita', {}, authRun)
  .command(createCommand)
  .command(serveCommand)
  .help()
  .argv;