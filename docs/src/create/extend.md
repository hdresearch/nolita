# Extending your application

You can most easily start tweaking your project by modifying the two pieces of state at the top of the `App` class in `/app/src/App.tsx`:

```ts
  // You can change the URL to any website for the objective.
  const [url] = React.useState("https://www.google.com");


  const [objective] = React.useState(
    "where to find food in",
  );
  const [location, setLocation] = React.useState(
    "West Village"
  )
```

and its appropriate code in the server, at `./server/index.ts`:

```ts
// ...
app.get("/api/browse", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  const browser = await Browser.create(true);
  const logger = new Logger(["info"], (msg) => {
    return res.write(`data: ${msg}\n\n`);
  });
  const agentBrowser = new AgentBrowser({ 
    agent, 
    browser, 
    // ...
```

You can then pass different objectives and start URLs to the backend, or pre-process incoming objectives with calls to APIs. You can pass steps from the Logger to external classes if necessary. You can also take the answer reported back from `agentBrowser.browse` and chain more actions onto it before returning to the user.

## Extensions and inventories

Remember that you can always pass different pieces of personal data, i.e. [inventories](../reference/inventory.html) *per user*, whether stored in a database outside the template application or as another component of the application itself. By doing so, you can effectively customize agentic responses to the user as necessary.

## Additional infrastructure

In production, you may find that one browser can't handle significant load. In such cases, an external API for spinning up multiple browsers on multiple machines may be necessary. Additional changes for Nolita are incoming for multi-tab browsing within one machine and for attaching white-label headless browsers in a future release.