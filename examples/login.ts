import yargs from "yargs/yargs";
import { z } from "zod";
import { OpenAIChatApi } from "llm-api";

import { AgentBrowser } from "../src/agentBrowser";
import { Logger } from "../src/utils";
import { Browser } from "../src/browser";
import { Agent } from "../src/agent/agent";
import { Inventory } from "../src/inventory";

import { ModelResponseSchema } from "../src/types/browser/actionStep.types";

const parser = yargs(process.argv.slice(2)).options({
  headless: { type: "boolean", default: true },
});

async function main() {
  const argv = await parser.parse();

  const startUrl = "https://practicetestautomation.com/practice-test-login/";
  const objective = "please login into the website";
  const maxIterations = 10;

  const logger = new Logger("info");
  const openAIChatApi = new OpenAIChatApi(
    {
      apiKey: process.env.OPENAI_API_KEY,
    },
    { model: "gpt-4" }
  );
  const agent = new Agent(openAIChatApi);
  const browser = await Browser.create(argv.headless);

  // here we define the inventory
  const inventory = new Inventory([
    { value: "student", name: "Username", type: "string" },
    { value: "Password123", name: "Password", type: "string" },
  ]);

  const agentBrowser = new AgentBrowser(agent, browser, logger, inventory);

  const answer = await agentBrowser.browse(
    {
      startUrl: startUrl,
      objective: [objective],
      maxIterations: maxIterations,
    },
    ModelResponseSchema
  );

  console.log("Answer:", answer?.result);
  await agentBrowser.close();
}

main();
