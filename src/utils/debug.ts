import { debug as mDebug } from "debug";

const error = mDebug("hdr-browser:error");
const log = mDebug("hdr-browser:log");

log.log = console.log.bind(console);

export const debug = {
  error,
  log,
  write: (t: string) =>
    process.env.DEBUG &&
    (process.env.DEBUG === "*" || "hdr-browser:log".match(process.env.DEBUG)) &&
    process.stdout.write(t),
};
