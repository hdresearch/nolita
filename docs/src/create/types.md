# Specifying types

We use `zod` under the hood to enforce typed responses from the agent. You can use this to enforce predictable output for your application.

For example, in the example repository we include the following in `extensions/schema.ts`:

```ts
export const CustomSchema = ModelResponseSchema(ObjectiveComplete.extend({
  restaurants: z.array(
    z.string().optional().describe("The name of a restaurant")
)}));
```