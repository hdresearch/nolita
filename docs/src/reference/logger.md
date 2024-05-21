# Logger

Our logger enforces a log level with an optional callback. You can use this to surface objective progress.

```ts
const logger = new Logger("info", (msg) => {
    return console.log(`${msg}`);
  });
```
