# AgentBrowser

This class unifies all prior classes for agentic browsing.

```ts
// instantiation

const agentBrowser = new AgentBrowser({
    agent: new Agent({ modelApi: chatApi }),
    browser: await Browser.create(headless),
    logger: new Logger(["info"]),
    inventory: new Inventory([
      { value: "sample.name@protonmail.com", name: "email", type: "string" },
      { value: "Password.123", name: "Password", type: "string" },
    ]),
    collectiveMemoryConfig: {
      apiKey: '***',
      endpoint: 'https://api.hdr.is'
    },
  });
```

## Methods

### `browse()`

Given a start URL, an objective and a maximum number of steps, it attempts to achieve the given objective and return an answer. The expected type of the response is passed as a second parameter.

```ts
// import { ModelResponseSchema } from "nolita";
// 
const answer = await agentBrowser.browse(
    {
      startUrl: req.query.url as string,
      objective: [req.query.objective as string],
      maxIterations: parseInt(req.query.maxIterations as string) || 10,
    },
    ModelResponseSchema,
  );
```

### `performMemory()`

If the Memory Index has a matching memory for the objective and page structure, this method modifies the actions to perform on the page while maintaining our current state. Mostly called by the AgentBrowser itself.

### `followPath()`, `followRoute()`

Both are called within the AgentBrowser itself as exploration utilities for applicable memories.

### `remember()`

Called during navigation. Creates a new Memory and saves it at the HDR endpoint. Performed if objective is successful.

### `step()`

Called by `browse()`. Contains the logic for prompting the [Agent](./agent.html) for the next set of commands for navigation. Adds a call to memorize the step in case the objective is successful.

### `close()`

Closes the agent browser session.
