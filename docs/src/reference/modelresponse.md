# ModelResponseSchema

Our base typed response for the agent's state machine. It can be extended with [Zod](https://github.com/colinhacks/zod). See [specifying types](../create/types.html) for an example.

```ts
// /src/types/browser/actionStep.types.ts
export const ModelResponseSchema = <TObjectiveComplete extends z.AnyZodObject>(
  objectiveCompleteExtension?: TObjectiveComplete
) =>
  z.object({
    progressAssessment: z.string(),
    command: BrowserActionSchemaArray.optional().describe(
      "List of browser actions"
    ),
    objectiveComplete: objectiveCompleteExtension
      ? ObjectiveComplete.merge(objectiveCompleteExtension)
          .optional()
          .describe(
            "Only return description of result if objective is complete"
          )
      : ObjectiveComplete.optional().describe(
          "Only return description of result if objective is complete"
        ),
    description: z.string(),
  });
```

Each step must fit the schema presented above, requiring our agent to assess its progress and provide a list of browser actions to perform next.

Optionally takes an extension to its [ObjectiveComplete](./objectivecomplete.html) type schema.
