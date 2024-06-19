#! /usr/bin/env node

import { build } from "gluegun";
import { run } from "./run";

const cli = build()
  .brand("nolita")
  .src(__dirname)
  .plugins("./node_modules", { matching: "hdr-*", hidden: true })
  .help()
  .defaultCommand(run)
  .create()
  .run()
  .then(() => {
    process.exit(0);
  });
