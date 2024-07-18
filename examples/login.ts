import yargs from "yargs/yargs";

import { Browser } from "../src/browser";
import { Agent } from "../src/agent/agent";
import { Inventory } from "../src/inventory";
import { completionApiBuilder } from "../src/agent";
import { Logger } from "../src/utils";
import { nolitarc } from "../src/utils/config";

const parser = yargs(process.argv.slice(2)).options({
  headless: { type: "boolean", default: true },
});

// this imports your config from running `npx nolita auth`
// if you haven't run `npx nolita auth` yet, you can set ANTHROPIC_API_KEY in your environment
const { agentProvider, agentApiKey, agentModel } = nolitarc();

async function main() {
  const argv = await parser.parse();

  const startUrl = "https://practicetestautomation.com/practice-test-login/";
  const objective = "please login into the website";
  const maxIterations = 10;

  const providerOptions = {
    apiKey: agentApiKey || process.env.ANTHROPIC_API_KEY!,
    provider: agentProvider || "anthropic",
  };

  // We can create a chat api using the completionApiBuilder.
  // These can be swapped out for other providers like OpenAI
  const chatApi = completionApiBuilder(providerOptions, {
    model: agentModel || "claude-3-5-sonnet-20240620",
  });

  if (!chatApi) {
    throw new Error(
      `Failed to create chat api for ${providerOptions.provider}`,
    );
  }

  // You can define a custom callback function to handle logs
  // this callback will print logs to the console
  // but you can further extend this to send logs to a logging service
  const logger = new Logger(["info"], (msg) => console.log(msg));

  // here we define the inventory
  // inventories are used to store values that can be used in the browser
  // for example, a username and password
  // information in the inventory can be used in the browser to to complete tasks
  // inventory values are never exposed to either collective memory or the model api
  const inventory = new Inventory([
    { value: "student", name: "Username", type: "string" },
    { value: "Password123", name: "Password", type: "string" },
  ]);

  const agent = new Agent({ modelApi: chatApi });
  const browser = await Browser.launch(argv.headless, agent, logger, {
    inventory,
  });

  const page = await browser.newPage();
  await page.goto(startUrl);
  const answer = await page.browse(objective, {
    maxTurns: maxIterations,
  });
  // @ts-expect-error - we are not using the full response schema
  console.log("Answer:", answer?.objectiveComplete?.result);
  await browser.close();
}

main();
