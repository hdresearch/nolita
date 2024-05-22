# Using Nolita as a server

Since Nolita is written in TypeScript, it may not work for every pre-existing product. If you would like to use the same task-runner API provided by [`npx nolita`](./tasks.html) for your own applications, you can run Nolita as a server.

```sh
npx nolita serve
```

![](https://content.hdr.is/serve.gif)

This runs a local API for objective-first agentic navigation of a local Chrome instance. 

After starting the server, you can see the `/doc` folder for the expected JSON payload.

## Example payload

```sh
curl -X POST http://localhost:3000/browse \
      -H "Content-Type: application/json" \
      -d '{
        "browse_config": {
            "startUrl": "https://google.com",
            "objective": [
            "please tell me how many people edited wikipedia"
            ],
            "maxIterations": 10
        },
        "provider_config": {
            "apiKey": "sk-***",
            "provider": "openai"
        },
        "model_config": {
            "model": "gpt-4"
        },
        "headless": true
        }
      '
```

## Flags

- `--port` will customize the port. By default, the server runs on port 3000.
