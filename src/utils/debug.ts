import { debug as mDebug } from "debug";
import { EventEmitter } from "events";

const error = mDebug("hdr-browser:error");
const log = mDebug("hdr-browser:log");

log.log = console.log.bind(console);

export const debug = {
  error,
  log,
  write: (t: string) =>
    process.env.DEBUG &&
    (process.env.DEBUG === "*" || "browser:log".match(process.env.DEBUG)) &&
    process.stdout &&
    process.stdout.write(t),
};

export class Logger {
  logStream: string[];
  events: EventEmitter;

  constructor(logLevel: string) {
    this.logStream = [];
    this.events = new EventEmitter();
  }

  log(input: string) {
    this.logStream.push(input);
    this.events.emit("logAdded", input);
    debug.log(input + "\n");
  }

  streamHandler() {
    this.events.on("logAdded", (input) => {});
  }
}
