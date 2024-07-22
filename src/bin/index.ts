#! /usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

import { build } from "gluegun";
import { run } from "./run";
const auth = require("./commands/auth");
const create = require("./commands/create");
const serve = require("./commands/serve");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const cli = build()
  .brand("nolita")
  .src(__dirname)
  .plugins("./node_modules", { matching: "hdr-*", hidden: true })
  .help()
  .defaultCommand(run)
  .command(auth)
  .command(serve)
  .command(create)
  .create()
  .run()
  .then(() => {
    process.exit(0);
  });
