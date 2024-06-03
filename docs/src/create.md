# Creating a new project

```sh
npx nolita create
```

![](https://content.hdr.is/create.gif)

Bootstraps a template application built on [Express](https://github.com/expressjs/express), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and the core Nolita framework for making a user-facing, web-enabled, agentic product.

For reference, the template repository resides at [hdresearch/create](https://github.com/hdresearch/create). Upon running the `create` command, the repository is cloned, its dependencies are installed and example files are instantiated.

## Except one...

Please note that you will need to set up a `.env` file to use the application. You can copy and paste the example environment to modify it from there:

```sh
cp .env.example .env
```

## What does it do?

The example application is extremely simple: it finds food from a specific location and outputs typed data, surfacing each step of the navigation in the console.

At the top of the `App` class in `app/src/App.tsx` you can start modifying the core objective:

```ts
  // You can change the URL to any website for the objective.
  const [url] = React.useState("https://www.google.com");


  const [objective] = React.useState(
    "where to find food in",
  );
  const [location, setLocation] = React.useState(
    "West Village"
  )
```

Tweaking these default values will then tweak what is requested from the server in `app/src/lib/events.ts`:

```ts
eventSource = new EventSource(
    `http://localhost:3040/api/browse?url=${encodeURIComponent(url)}&objective=${encodeURIComponent(objective)}%20${encodeURIComponent(location)}&maxIterations=10`,
  );
```

Which itself hits the server at `/server/index.ts`, running at port 3040 (in the dev environment) and taking in these parameters:

```ts
  const answer = await agentBrowser.browse(
    {
      startUrl: req.query.url as string,
      objective: [req.query.objective as string],
      maxIterations: parseInt(req.query.maxIterations as string) || 10,
    },
    CustomSchema,
  );
```
And returning each step back to the `EventSource` in as a callback to the browser's `Logger`:

```ts
  const logger = new Logger(["info"], (msg) => {
    return res.write(`data: ${msg}\n\n`);
  });
```

For more information, continue reading about [the folder structure](./create/folder.html).