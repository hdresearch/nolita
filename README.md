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
import { Logger, Browser, Agent, AgentBrowser } from "@hdr/browser";

// Logger takes a `logLevel` string
const logger = new Logger("info");
const openAIChatApi = new OpenAIChatApi(
    {
        apiKey: process.env.OPENAI_API_KEY,
    },
    { model: "gpt-4" }
);

const agent = new Agent(openAIChatApi);
// Browser takes a `headless` boolean
const browser = await Browser.create(true);
const agentBrowser = new AgentBrowser(agent, browser, logger);
```

Once instantiated, the `AgentBrowser` is used with the `browse` method.

```ts
const response = await agentBrowser.browse(
    {
        startUrl: "https://duckduckgo.com",
        objective: ["Your task here"],
        // 10 is a good default for our navigation limit
        maxIterations: 10
    }
) 
```

The `browse` method also allows you to extend the model response, constructing a typed response for your applications.

A complete example of using the browser in your projects to produce typed and structured results is included in the [examples folder](/examples/).

### Using `npx`

The following flags are used when calling the script directly:

- `--objective "Your task"` describes the task involved for the agent to perform using the browser. In this case, we're using "Your task" as an example.
- `--startUrl "https://duckduckgo.com"` describes where on the internet to start achieving the objective.
- `--agentProvider "openai"` describes what provider to use for achieving the objective. If you'd like to not repeat this flag, you can set the `HDR_AGENT_PROVIDER` environment variable in your terminal.
- `--agentModel "gpt-4"` passes which model to use. This can be automatically set by setting the `HDR_AGENT_MODEL` environment variable.
- `--agentApiKey YOUR_KEY` passes any applicable API key to the agent provider. This can be automated by setting the `HDR_AGENT_API_KEY` environment variable.
- `--headless` sets whether to open a headless Chrome instance. By default, this is set to `false`, which will open a visible, automated Chrome window when performing a task. If you'd like to not repeat this flag, set the `HDR_HEADLESS` environment variable.

Taken together, an example would be:

```bash
npx @hdr/browser --agentProvider openai --agentModel gpt-4 --agentApiKey [key] --objective "how many editors are on wikipedia?" --startUrl "https://google.com"
```

