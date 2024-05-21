# Agent

Wraps an LLM and creates a class for participating with the browser in state machine loops and a predefined prompt. You can wrap an LLM that is parsed by `llm-api` with our `completionApiBuilder`.

```ts
const providerOptions = {
  apiKey: process.env.PROVIDER_API_KEY,
  provider: process.env.MODEL_PROVIDER,
};

const modelApi = completionApiBuilder(providerOptions, {
  model: process.env.MODEL,
});

const agent = new Agent({ modelApi });
```

You can optionally change the system prompt.

```ts
const agent = new Agent({ modelApi, systemPrompt: "You are a little mean and sassy." });
```