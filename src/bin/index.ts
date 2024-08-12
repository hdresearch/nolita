#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { run as defaultRun } from './run';
import { run as authRun } from './commands/auth';
import * as createCommand from './commands/create';
import * as serveCommand from './commands/serve';

yargs(hideBin(process.argv))
  .command('$0', 'Run the default Nolita command', {}, defaultRun)
  .command('auth', 'Authenticate and configure Nolita', {}, authRun)
  .command(createCommand)
  .command(serveCommand)
  .help()
  .argv;