# AgentBrowser

This class unifies all prior classes and includes the state machine logic.

```ts
const answer = await agentBrowser.browse(
    {
      startUrl: req.query.url as string,
      objective: [req.query.objective as string],
      maxIterations: parseInt(req.query.maxIterations as string) || 10,
    },
    ModelResponseSchema,
  );
```
