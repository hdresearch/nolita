import yargs from "yargs/yargs";
import { z } from "zod";

import { AgentBrowser } from "../src/agentBrowser";
import { Browser } from "../src/browser";
import { Agent } from "../src/agent/agent";
import { Inventory } from "../src/inventory";
import { completionApiBuilder } from "../src/agent";
import { Logger } from "../src/utils";

import { ModelResponseSchema, ObjectiveComplete } from "../src/types";
import { ObjectiveCompleteResponse } from "../src/types/browser/actionStep.types";

const parser = yargs(process.argv.slice(2)).options({
  headless: { type: "boolean", default: true },
});

async function main() {
  const argv = await parser.parse();

  const startUrl = "http://shop.junglegym.ai/customer/account/login";

  const objective =
    "please login into the website then tell me the order total for the five most recent orders";
  const maxIterations = 15;

  const providerOptions = {
    apiKey: process.env.OPENAI_API_KEY!,
    provider: "openai",
  };
  const chatApi = completionApiBuilder(providerOptions, { model: "gpt-4" });

  if (!chatApi) {
    throw new Error(
      `Failed to create chat api for ${providerOptions.provider}`
    );
  }
  const logger = new Logger(["info"], (msg) => console.log(msg));

  // You can pass in collective memory configuration to the agent browser
  const collectiveMemoryConfig = {
    apiKey: process.env.HDR_API_KEY!,
    endpoint: process.env.HDR_ENDPOINT!,
  };

  const agentBrowser = new AgentBrowser({
    agent: new Agent({ modelApi: chatApi }),
    browser: await Browser.create(argv.headless),
    logger,
    inventory: new Inventory([
      { value: "emma.lopez@gmail.com", name: "email", type: "string" },
      { value: "Password.123", name: "Password", type: "string" },
    ]),
    collectiveMemoryConfig,
  });

  const orderTotalAnswer = ObjectiveComplete.extend({
    orderTotals: z.array(
      z.number().describe("The order total in number format")
    ),
  });

  const answer = await agentBrowser.browse(
    {
      startUrl: startUrl,
      objective: [objective],
      maxIterations: maxIterations,
    },
    ModelResponseSchema(orderTotalAnswer)
  );

  console.log("\x1b[32m Answer:", JSON.stringify(answer?.result));
  await agentBrowser.close();
}

main();
