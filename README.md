# @hdr/browser

An objective-oriented, typed browser automation framework for LLM applications.

Control local (or sandboxed) Chrome installations with passthrough models. Gather structured content from the internet with user-defined types.

## Installation

```bash
npm i --save @hdr/browser
```

Execute directly from the terminal with `npx`.

```bash
npx @hdr/browser [flags]
```

## Usage

Usage will vary depending on whether you employ this package as an executable or as an imported module.

### Usage as an imported module

The basic usage is based around the `AgentBrowser` class. It requires the `Agent` class (which requires an instantiated chat completion API class), `Browser` class, as well as a `Logger` class.

```ts
const {
  Logger,
  Browser,
  Agent,
  Inventory,
  AgentBrowser,
} = require("@hdr/browser");

const openAIChatApi = new OpenAIChatApi(
  {
    apiKey: process.env.OPENAI_API_KEY,
  },
  { model: "gpt-4" }
);
const agent = new Agent(openAIChatApi);

// Browser takes a `headless` boolean
const browser = await Browser.create(true);

// Logger takes a `logLevel` string
const logger = new Logger("info");
```

If you need the agent to use sensitive data such as usernames and passwords, credit cards, addresses, etc. to do a task, you can place that information inside the agent's inventory. The inventory scrambles this data so that the underlying LLM api never sees the actual information. The browser monitors the values the agent enters into text fields and then intercepts and replaces the scrambled data with the real thing.

```ts
// Inventory is optional, but helps when you have data you want to use for the objective
const inventory = new Inventory([
  { value: "student", name: "Username", type: "string" },
  { value: "Password123", name: "Password", type: "string" },
]);
```

The `AgentBrowser` uses [zod](https://github.com/colinhacks/zod) under the hood to control the types returned by your LLM. If you want to specify a custom return type, you can do so by extending the `ModelResponse` schema with the desired type.

```ts
const extendedModelResponseSchema = ModelResponseSchema.extend({
  numberArray: z.array(
    z.number().optional().describe("your description here") // Note: the description is important since it tells the LLM what kind of data is important
  ),
});
```

```ts
const agentBrowser = new AgentBrowser(agent, browser, logger, inventory);
```

Once instantiated, the `AgentBrowser` is used with the `browse` method.

```ts
const response = await agentBrowser.browse(
  {
    startUrl: "https://duckduckgo.com",
    objective: ["Your task here"],
    // 10 is a good default for our navigation limit
    maxIterations: 10,
  },
  extendedModelResponseSchema
);
```

A complete example of using the browser in your projects to produce typed and structured results is included in the [examples folder](/examples/).

### Using `npx`

The following flags are used when calling the script directly:

- `--objective "Your task"` describes the task involved for the agent to perform using the browser. In this case, we're using "Your task" as an example.
- `--startUrl "https://duckduckgo.com"` describes where on the internet to start achieving the objective.
- `--agentProvider "openai"` describes what provider to use for achieving the objective.
- `--agentModel "gpt-4"` passes which model to use.
- `--agentApiKey YOUR_KEY` passes any applicable API key to the agent provider.
- `--headless` sets whether to open a headless Chrome instance. By default, this is set to `false`, which will open a visible, automated Chrome window when performing a task.
- `--config` allows you to pass in a .json file for setting config flags and user data inventory. For more information, see below.

Taken together, an example would be:

```bash
npx @hdr/browser --agentProvider openai --agentModel gpt-4 --agentApiKey [key] --objective "how many editors are on wikipedia?" --startUrl "https://google.com"
```

#### Storing commonly reused information

When running `@hdr/browser` under `npx`, we will check for both environment variables and an optional `config.json` file.

**`config.json`**

Here is an example `config.json`:

```json
{
  "agentProvider": "openai",
  "agentModel": "gpt-4",
  "agentApiKey": "a-key",
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
  ],
  "headless": true
}
```

You can then call your browser by running

```bash
npx @hdr/browser --config config.json
```

The script will ask for your start URL and objective if not provided in the config.json or with the `--objective` and `--startUrl` flags.

**Setting environment variables**

You can also set all flags as environment variables. We check for the following:

- `HDR_AGENT_PROVIDER`
- `HDR_AGENT_MODEL`
- `HDR_AGENT_API_KEY`
- `HDR_HEADLESS`

Objective, start URL and inventory cannot be set with environment variables.

## Running as a server

If you are using `@hdr/browser` in another language stack, like Python, we recommend running the browser in server mode. To start the webserver, you can run `npm run serve` or you can run the server from a container using:

```sh
docker build . -t hdr/browser # on arm64 macOS, you may need --platform linux/amd64
docker run -p 3000:3000 -t hdr/browser # --platform linux/amd64
```

You can access documentation for using the server at `localhost:3000/doc`.

## Contributing

Before contributing to this project, please review [CONTRIBUTING](/CONTRIBUTING).

To connect with others building with `@hdr/browser`, feel free to join our [Discord community](https://discord.gg/SpE7urUEmH).

## Other licenses

By default, `@hdr/browser` sends anonymised, abstracted telemetry to our collective memory, which is governed [by its own license agreement](https://hdr.is/terms) and our [privacy policy](https://hdr.is/privacy).