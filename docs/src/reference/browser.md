# Browser

We wrap Puppeteer, incorporating state machine hooks and a lot of accessibility preprocessing.

```ts
// headless: boolean
// used for opening the Chrome browser
const browser = await Browser.create(true);
```

## Methods

### `create()`

Takes a boolean for headless mode, a websocket endpoint for another browser, and the mode the browser should run in (presently only supporting `text`).

Opens a browser context.

### `close()`

Closes the page and the browser.

### `goTo()`

Takes a URL and a delay in milliseconds. Navigates within the page context.

### `content()`

Returns the page's [`innerText`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/innerText).

### `captureScreenshot()`

Takes one boolean for whether or not it should be the full page.

Returns a buffer in base64 with a screenshot of the page content.

### `getMap()`

Used to show the map of all index identifiers on the page.

### `url()`

Returns the URL the browser is currently at.

### `state()`

Given the objective and current objective progress, parses the Aria tree and returns the URL, Aria tree, progress and objective.

### `scroll()`

Scrolls the page. Used by the agent.

### `performAction()`, `performManyActions()`

Takes a command (or several) from an action step created by the Agent class.

### `parseContent()`

Gets the accessibility tree of the page, creates a new map of index nodes, simplifies the tree and passes it as a string.

### `injectBoundingBoxes()`

Utility for vision model navigation so far unused. Injects a script that places coloured boxes around usable elements.