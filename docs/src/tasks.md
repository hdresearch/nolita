# Running tasks

If you want to test Nolita out quickly, you can do so on the command line by running

```sh
npx nolita
```

![](https://content.hdr.is/runner.gif)

**When running, you must provide a `startUrl` and `objective`**. Before your first run, you will need to authenticate your model details and HDR keys with `npx nolita auth`.

If you don't include information, we will prompt you for it at runtime. 

## Flags

- `--startUrl` dictates where we start the session.
- `--objective` specifies what we want our agent to accomplish for us.
- `--headless` specifies whether you want the browser to run in headless mode or not. We default to `true`, but you can set it to `false` to see the browser run.
- `--config` takes a JSON file with the previous flags, if you want to provide them. You can also specify an **inventory** of personal data to use for the objective, like usernames and passwords. If you want to set per-task agent credentials, you can do so here and they will take precedence over `nolita auth`.

### Optional features

- `--record` will return the ID of the completed task session for later replay of the same actions, which you can use with the [Page](https://nolita-9filhsrbk-hdr-team.vercel.app/reference/classes/Page.html#followroute) API.
- `--replay` takes in a string of the ID above and currently just confirms that the route can be successfully followed. When using `replay`, objective and start URL are discarded.

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