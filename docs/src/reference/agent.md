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

## Methods

The methods of the agent class are largely unused as external interfaces, and are partially described here in order to illustrate the interactions between Nolita classes.

### `prompt()`

Takes current objective state, applicable memories from the memory index, and a configuration of inventory items and the system prompt.

Returns a chat request message in the shape of an action step.

### `modifyActions()`

Takes the current state, applicable memories, and a configuration of inventory items, the system prompt and the maximum attempts.

Using Zod, we present the past state-action pair and ask to modify its outputted action steps until they are valid.

### `_call()`, `askCommand()`, `call()`, `actionCall()`, `returnCall()`, and `chat()`

All are used to interact with the chat completion API, parsing responses using an inputted type schema.