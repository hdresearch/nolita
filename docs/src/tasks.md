# Running tasks

If you want to test Nolita out quickly, you can do so on the command line by running

```sh
npx nolita
```

![](https://content.hdr.is/runner.gif)

**You must provide a `startUrl`, `objective`, `agentProvider`, and `agentModel`**. 

If you don't include information, we will prompt you for it at runtime. 

## Flags

- `--startUrl` dictates where we start the session.
- `--objective` specifies what we want our agent to accomplish for us.
- `--agentProvider` sets who is providing the LLM for the task (currently supporting `anthropic` and `openai`).
- `--agentModel` specifies the model in question by the provider.
- `--hdrApiKey` takes your HDR key for persistent [memory integration](https://hdr.is/memory), improving the performance and reliability of tasks.
- `--headless` specifies whether you want the browser to run in headless mode or not. We default to `true`, but you can set it to `false` to see the browser run.
- `--config` takes a JSON file with the previous flags, if you want to provide them. You can also specify an **inventory** of personal data to use for the objective, like usernames and passwords.

## Example configuration

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
            "type": "string" 
        }
    ]
}
```