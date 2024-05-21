# nolita

A web-enabled agentic framework. 

Interact with the web with an AI model of your choice and build quick runners, pipe into your scripts, or scaffold full-stack applications.

Nolita uses a sandboxed, on-device Chrome instance and supports a variety of AI models, with more on the way.

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

Runs a local API for objective-first agentic navigation of a local Chrome instance. After starting the server, you can see the `/doc` folder for the expected JSON payload.

Use `--port` to customize the port.

## Build an app

```sh
npx nolita create
```

![](https://content.hdr.is/create.gif)

Bootstraps a template application built on Express, React, TypeScript, and the core Nolita framework for making a user-facing, web-enabled, agentic product. For more information on using the template, see [its documentation](/docs/create).

## How does it work?

Nolita drives a Puppeteer installation using local Chrome and parses the accessiblity tree, preprocessing ARIA nodes to add additional accessibility information when necessary.

At the core of the framework is a state machine between Puppeteer and your model that enforces action steps with [Zod](https://github.com/colinhacks/zod).

Since we enforce types at runtime, you can also customize the typed response you get from the navigation process! For more about that, see "[Specifying types](#specifying-types)."

## Documentation and examples

To read the complete documentation for Nolita, you can go to the `docs` folder in this repository or access [docs.nolita.ai](https://docs.nolita.ai). 

There are also various examples of usage in the [examples folder](/examples/).

## Contributing

Before contributing to this project, please review [CONTRIBUTING](/CONTRIBUTING).

To connect with others building with Nolita, feel free to join our [Discord community](https://discord.gg/SpE7urUEmH).

## Other licenses

By default, Nolita sends anonymised, abstracted telemetry to our collective memory, which is governed [by its own license agreement](https://hdr.is/terms) and our [privacy policy](https://hdr.is/privacy).