# Specifying types

We use [Zod](https://github.com/colinhacks/zod) under the hood to enforce typed responses from the agent. You can use this to enforce predictable output for your application.

For example, in the example repository we include the following in [`extensions/schema.ts`](https://github.com/hdresearch/create/blob/main/extensions/schema.ts):

```ts
export const CustomSchema = z.object({
  restaurants: z.array(z.string().describe("The name of a restaurant")),
});
```

In this example, we inform the agent that we expect the response that reports a completed objective to also include an array of restaurants. When we finally get `ObjectiveComplete` back from the agent as an answer, we will also see restaurants as part of the response:

```ts
// inside the event response from the server`
export type AgentEvent = {
  command?: string[];
  done?: boolean;
  progressAssessment?: string;
  description?: string;
  objectiveComplete?: {
    kind: "ObjectiveComplete";
    restaurants: string[];
    result: string;
  }
  objectiveFailed: {
    kind: "ObjectiveFailed";
    result: string;
  }
};
```