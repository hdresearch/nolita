import yargs from "yargs/yargs";
import { z } from "zod";

import { AgentBrowser } from "../src/agentBrowser";
import { Browser } from "../src/browser";
import { Agent } from "../src/agent/agent";
import { Inventory } from "../src/inventory";
import { completionApiBuilder } from "../src/agent/config";

import { ModelResponseSchema } from "../src/types/index";

const parser = yargs(process.argv.slice(2)).options({
  headless: { type: "boolean", default: true },
});

async function main() {
  const argv = await parser.parse();

  const startUrl = "http://shop.junglegym.ai/customer/account/login/";

  const objective =
    "please login into the website then tell me the order total for the five most recent orders";
  const maxIterations = 10;

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

  const agentBrowser = new AgentBrowser({
    agent: new Agent({ modelApi: chatApi }),
    browser: await Browser.create(argv.headless),
    inventory: new Inventory([
      { value: "emma.lopez@gmail.com", name: "email", type: "string" },
      { value: "Password.123", name: "Password", type: "string" },
    ]),
  });

  const orderTotalAnswer = ModelResponseSchema.extend({
    orderTotals: z.array(
      z.number().optional().describe("The order total in number format")
    ),
  });

  const answer = await agentBrowser.browse(
    {
      startUrl: startUrl,
      objective: [objective],
      maxIterations: maxIterations,
    },
    orderTotalAnswer
  );

  console.log("Answer:", answer?.result);
  await agentBrowser.close();
}

main();
