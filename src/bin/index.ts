#! /usr/bin/env node

import { build } from "gluegun";
import { run } from "./run";

const cli = build()
  .brand("hdr")
  .src(__dirname)
  .plugins("./node_modules", { matching: "hdr-*", hidden: true })
  .defaultCommand(run)
  .create()
  .run()
  .then(() => {
    process.exit(0);
  });
