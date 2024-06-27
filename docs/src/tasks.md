# Running tasks

If you want to test Nolita out quickly, you can do so on the command line by running

```sh
npx nolita
```

![](https://content.hdr.is/runner.gif)

Before first run, ensure you run `npx nolita auth` to set a model provider, applicable API keys, and optionally, your HDR key for the [Memory Index](https://hdr.is/memory).

You can also set model configuration on a per-task basis using the flags and configuration below.

## Flags

- `--startUrl` dictates where we start the session.
- `--objective` specifies what we want our agent to accomplish for us.
- `--headless` specifies whether you want the browser to run in headless mode or not. We default to `true`, but you can set it to `false` to see the browser run.
- `--maxIterations` sets the maximum number of steps allowed to accomplish the objective. The default is 10.
- `--config` takes a JSON file with the previous flags, if you want to provide them. You can also specify an **inventory** of personal data to use for the objective, like usernames and passwords.

## Example configuration

```json
{
  "agentProvider": "openai",
  "agentModel": "gpt-4",
  "agentApiKey": "sk-*********",
  "hdrApiKey": "hdr-***",
  "objective": "what is their address?",
  "startUrl": "https://***",
  "headless": false,
  "maxIterations": 10,
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