import yargs from "yargs/yargs";
import { z } from "zod";

import { Browser } from "../src/browser";
import { Agent } from "../src/agent/agent";
import { Inventory } from "../src/inventory";
import { completionApiBuilder } from "../src/agent";
import { Logger } from "../src/utils";
import { nolitarc } from "../src/utils/config";

// these are imported from `npx nolita auth`
// if you haven't set config, you can set the defaults for this example in your environment:
// OPENAI_API_KEY, HDR_API_KEY
const { hdrApiKey, agentProvider, agentModel, agentApiKey } = nolitarc();

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
    apiKey: agentApiKey || process.env.OPENAI_API_KEY!,
    provider: agentProvider || "openai",
  };
  const chatApi = completionApiBuilder(providerOptions, {
    model: agentModel || "gpt-4",
  });

  if (!chatApi) {
    throw new Error(
      `Failed to create chat api for ${providerOptions.provider}`,
    );
  }
  const logger = new Logger(["info"], (msg) => console.log(msg));

  const agent = new Agent({ modelApi: chatApi });
  const browser = await Browser.launch(argv.headless, agent, logger, {
    apiKey: hdrApiKey || process.env.HDR_API_KEY!,
  });
  const page = await browser.newPage();
  await page.goto(startUrl);
  const answer = await page.browse(objective, {
    maxTurns: maxIterations,
    schema: z.object({
      orderTotals: z
        .array(z.number())
        .describe("The order total in number format"),
    }),
    inventory: new Inventory([
      { value: "emma.lopez@gmail.com", name: "email", type: "string" },
      { value: "Password.123", name: "Password", type: "string" },
    ]),
  });
  // @ts-expect-error - we are not using the full response schema
  console.log(
    "\x1b[32m Answer:",
    JSON.stringify(answer?.objectiveComplete?.orderTotals),
  );
  await browser.close();
}

main();
