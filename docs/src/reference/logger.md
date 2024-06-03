# Logger

Our logger enforces a log level with an optional callback. You can use this to surface objective progress.

```ts
const logger = new Logger(["info"], (msg) => {
    return console.log(`${msg}`);
  });
```

Takes a `LogLevel` array and an optional callback.

## Methods

### `log()`

Pushes an entry to the log stream and to the callback.

### `info()`

Logs input to the debug log.
