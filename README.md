# nolita

A framework for quickly building and running web-enabled agentic applications.

## Installation

```bash
npm i --save nolita
```

Execute directly from the terminal with `npx`.

```bash
npx nolita [flags]
```

Bootstrap a project with the `create` command:

```bash
npx nolita create
```

## Usage

You can use Nolita for running quick tasks, as a persistent server for agentic web browsing, or to bootstrap an agentic product.

### Running quick tasks

The default `nolita` command runs a task in-browser and returns a result based on your desired objective, using a local sandboxed Chrome installation.

```bash
npx nolita [flags]
```

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

### Running as a server

If you don't use TypeScript as your main application language, you can interact with nolita as a server to run tasks within a larger project.

```bash
npx nolita serve [flags]
```

We currently support the following flags:

- `--port` specifies the port to run on.

Documentation for the server is mounted at the `/doc` directory.

### Bootstrapping a new project

If you want to configure each part of your project and build a new product from scratch, try the `create` command.

```bash
npx nolita create
```

Give it a project name and it bootstraps a template application built on Express, React, TypeScript, and the core Nolita framework for making a user-facing, web-enabled, agentic product.

## Additional information

### Exported classes

If you want to import pieces of Nolita for your application, you can. We export the following classes:

#### Agent

Wraps an LLM and creates a class for participating with the browser in state machine loops and a predefined prompt.. You can wrap an LLM that is parsed by `llm-api` with our `completionApiBuilder`.

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

```ts
```

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