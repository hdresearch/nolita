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
  logLevels: string[];
  events: EventEmitter;
  callback: ((input: string) => any) | undefined;

  constructor(
    logLevels?: string[],
    callback?: (input: string) => any | undefined
  ) {
    this.logStream = [];
    this.logLevels = logLevels || ["info"];
    this.events = new EventEmitter();
    this.streamHandler();
    this.callback = callback || undefined;
  }

  log(input: string) {
    this.logStream.push(input);
    this.events.emit("logAdded", input);
    debug.log(input);
    this.callback && this.callback(input);
  }

  info(input: string) {
    debug.log(input);
  }

  streamHandler() {
    this.events.on("logAdded", (input) => {});
  }
}
