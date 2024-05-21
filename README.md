# nolita

A web-enabled agentic framework. 

Interact with the web with an AI model of your choice and build quick runners, pipe into your scripts, or scaffold full-stack applications.

Nolita uses the on-device Chrome instance and supports a variety of AI models, with more on the way.

## Use for quick tasks

```sh
npx nolita
```

![](https://content.hdr.is/runner.gif)

If you don't include information, we will prompt you for it as we go. The flags you can provide to omit these steps include the following:

- `--startUrl` dictates where we start the session.
- `--objective` specifies what we want our agent to accomplish for us.
- `--agentProvider` sets who is providing the LLM for the task (currently supporting `anthropic` and `openai`).
- `--agentModel` specifies the model in question by the provider.
- `--hdrApiKey` takes your HDR key for persistent memory integration, improving the performance and reliability of tasks.
- `--headless` specifies whether you want the browser to run in headless mode or not. We default to `true`, but you can set it to `false` to see the browser run.
- `--config` takes a JSON file with the previous flags, if you want to provide them. You can also specify an **inventory** of personal data to use for the objective, like usernames and passwords.

```json
{
  "agentProvider": "openai", // or process.env.HDR_AGENT_PROVIDER
  "agentModel": "gpt-4", // or process.env.HDR_AGENT_MODEL
  "agentApiKey": "sk-*********", // or process.env.HDR_AGENT_API_KEY
  "inventory": [
    {  
      "value": "student", 
      "name": "Username", 
      "type": "string" 
    },
    { 
      "value": "Password123",
      "name": "Password",
      "type": "string" }
    ]
}
```

## Use as part of your stack

```sh
npx nolita serve
```

![](https://content.hdr.is/serve.gif)

Runs a local API for hitting up your local sandboxed Chrome for objective-first agentic navigation. See the `/doc` folder for the expected JSON payload.

Use `--port` to customize the port.

## Build an app

```sh
npx nolita create
```

![](https://content.hdr.is/create.gif)

Give it a project name and it bootstraps a template application built on Express, React, TypeScript, and the core Nolita framework for making a user-facing, web-enabled, agentic product.

## How does it work?

Nolita drives a Puppeteer installation using local Chrome and parses the accessiblity tree, preprocessing ARIA nodes to add additional accessibility information when necessary.

At the core of the framework is a state machine between Puppeteer and your model that enforces action steps with [Zod](https://github.com/colinhacks/zod).

Since we enforce types at runtime, you can also customize the typed response you get from the navigation process! For more about that, see "[Specifying types](#specifying-types)."

## Additional examples

We have various examples of usage in the [examples folder](/examples/).

## Writing applications with Nolita

### Exported classes

If you want to import pieces of Nolita for your application or scripts, you can. We export the following classes:

#### Agent

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

#### Browser

We wrap Puppeteer, incorporating state machine hooks and a lot of accessibility preprocessing.

```ts
const browser = await Browser.create(true);
```

It takes one boolean for `headless` mode. If `false,` Chrome will open graphically.


#### Logger

Our logger enforces a log level with an optional callback. You can use this to surface objective progress.

```ts
const logger = new Logger("info", (msg) => {
    return console.log(`${msg}`);
  });
```

#### Inventory

The Inventory class constructs keys and values to mask outside the prompt itself, ie. when using collective memory or subsequent tasks.

```ts

const ourInventory = {
    "inventory": [
        { 
            "value": "student",
            "name": "Username",
            "type": "string" 
        },
        { 
            "value": "Password123",
            "name": "Password",
            "type": "string"
        }
    ]
}

const inventory = new Inventory(ourInventory || []);
```

#### ModelResponseSchema

Our base typed response for the agent's state machine. It can be extended with `zod`. See "specifying types," below.

#### AgentBrowser

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

### Specifying types

We use `zod` under the hood to enforce typed responses from the agent. You can use this to enforce predictable output for your application.

For example, in the example repository we include the following in `extensions/schema.ts`:

```ts
export const CustomSchema = ModelResponseSchema(ObjectiveComplete.extend({
  restaurants: z.array(
    z.string().optional().describe("The name of a restaurant")
)}));
```

## Contributing

Before contributing to this project, please review [CONTRIBUTING](/CONTRIBUTING).

To connect with others building with Nolita, feel free to join our [Discord community](https://discord.gg/SpE7urUEmH).

## Other licenses

By default, Nolita sends anonymised, abstracted telemetry to our collective memory, which is governed [by its own license agreement](https://hdr.is/terms) and our [privacy policy](https://hdr.is/privacy).