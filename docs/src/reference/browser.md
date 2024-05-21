# Browser

We wrap Puppeteer, incorporating state machine hooks and a lot of accessibility preprocessing.

```ts
const browser = await Browser.create(true);
```

It takes one boolean for `headless` mode. If `false,` Chrome will open graphically.
