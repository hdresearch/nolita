# ObjectiveComplete

```ts
// /src/types/browser/actionStep.types.ts
export const ObjectiveComplete = z.object({
  kind: z.literal("ObjectiveComplete").describe("Objective is complete"),
  result: z.string().describe("The result of the objective"),
});
```

ObjectiveComplete serves as a prototype for defining structured responses. By default [ModelResponseSchema](./modelresponse.html) will use this basic type, but it can be extended with `ObjectiveComplete.extend()`, taking another Zod object, to enforce another entry in the type. You can then pass it to ModelResponseSchema as a parameter.