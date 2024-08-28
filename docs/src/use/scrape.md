# Use Nolita as a scraper

If you're trying to just quickly gather data from the web, Nolita enables you to both dictate how much you want a model to autonomously search for data and what shape the data needs to come back in. These two features in tandem enable very powerful automation scripting. In this guide, which elaborates upon [our findEmail example file](https://github.com/hdresearch/nolita/blob/main/examples/findEmail.ts), we'll walk you through what you need to do to get started.

## Installation

Assuming you've [installed Node.js](https://nodejs.org/) (preferably the LTS), let's create a new folder for our script and put Nolita in it.

```sh
mkdir email-gathering && cd email-gathering
npm i nolita zod
```

NPM will make a package.json file and a `node_modules` folder for everything we need. Now let's just make our file and open it in your preferred code editor.

```sh
touch index.js
```

## Necessary prerequisites

Nolita will want an applicable model set up before we start. 

In your terminal, you may want to run `npx nolita auth` and input your model provider (and any applicable keys). If you prefer writing the configuration yourself, create `.nolitarc` in your home folder and fill in the blanks here:

```json
{
    "agentModel": "", // use a model name from your provider
    "agentApiKey":"", // api key for anthropic / openai
    "agentProvider": "", //anthropic / openai
    "hdrApiKey":"" // optional
}
```

## Imports and setup

We're going to need to import the `Browser` class and the `makeAgent` utility. The `Browser` class is the main navigation engine Nolita provides us; `makeAgent` is just a helper for making chat completion classes for our model without us having to think about it.

```js
const { Browser, makeAgent } = require("nolita");
const { z } = require("zod");
```

Now we just write our main function, using those imports.

```js
async function main() {
  const agent = makeAgent();
  const browser = await Browser.launch(true, agent);
```

`Browser.launch()` has two inputs: whether or not to run the browser headless, and the agent to attach to the Browser instance. If you want to see the browser open and autonomously navigate the page, change `true` to `false`.

## Page actions

Now let's break down the next section. We'll use the browser constant here to make a `Page` class, corresponding to a browser tab, that we can manipulate and pilot:

```js
  const page = await browser.newPage();
  await page.goto("https://hdr.is");
  await page.do("click on the company link");
  const answer = await page.get(
    "Find all the email addresses on the page",
    z.object({
      emails: z
        .array(z.string())
        .describe("The email addresses found on the page"),
    })
  );
```

We use `.goto()` to start us off at a URL, which instantiates our session. `.do()` gives a natural language directive to our model to navigate the page and issue a command to the browser. Please note that it's a single action, specific to the current page -- if you want to give a broader objective to the model, you'll want `.browse()` instead.

`.get()`, likewise, is specific to the current page. We provide it an objective and a schema. Our model will parse the page content and return the data in the shape we provide in the schema. This shape corresponds to a basic [Zod object schema](https://github.com/colinhacks/zod?tab=readme-ov-file#objects). You'll want to ensure you chain [.describe()](https://github.com/colinhacks/zod?tab=readme-ov-file#describe) to let our model know exactly what you want.

In this case, we ask for an array of emails as strings inside a JSON object.

```js
  console.log(answer);
  await browser.close();
}

main();
```

## Adding it all together

Once it has the answer, it will write it to the console (making it pipeable to an arbitrary text file) and clean up the process.

In sum, our script looks like this:

```js
const { Browser, makeAgent } = require("nolita");
const { z } = require("zod");

async function main() {
  const agent = makeAgent();
  const browser = await Browser.launch(true, agent);
  const page = await browser.newPage();
  await page.goto("https://hdr.is");
  await page.do("click on the company link");
  const answer = await page.get(
    "Find all the email addresses on the page",
    z.object({
      emails: z
        .array(z.string())
        .describe("The email addresses found on the page"),
    })
  );
  console.log(answer);
  await browser.close();
}

main();
```

We can run it by just running `node index.js` and even write the result with `node index.js > emails.txt`. If we try running the latter command, we'll see in our .txt file:

```
{
  emails: [
    'tynan.daly@hdr.is',
    'matilde.park@hdr.is',
    'SUPPORT@HDR.IS'
  ]
}
```