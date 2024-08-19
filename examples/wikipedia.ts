import yargs from "yargs/yargs";
import { z } from "zod";

import { Browser } from "../src/browser";
import { makeAgent } from "../src/agent";
import { Logger } from "../src/utils";
import { nolitarc } from "../src/utils/config";

const parser = yargs(process.argv.slice(2)).options({
  headless: { type: "boolean", default: true },
  objective: { type: "string" },
  startUrl: { type: "string" },
  maxIterations: { type: "number", default: 10 },
});

// these are imported from `npx nolita auth`
// if you haven't set config, you can set the defaults for this example in your environment:
// OPENAI_API_KEY
const { agentApiKey, agentProvider, agentModel } = nolitarc();

async function main() {
  const argv = await parser.parse();

  const providerOptions = {
    apiKey: agentApiKey || process.env.OPENAI_API_KEY!,
    provider: agentProvider || "openai",
  };
  const agent = makeAgent(providerOptions, {
    model: agentModel || "gpt-4",
  });
  const logger = new Logger(["info"], (msg) => console.log(msg));

  const browser = await Browser.launch(argv.headless, agent, logger);
  const page = await browser.newPage();
  await page.goto(argv.startUrl || "https://google.com");
  const answer = await page.browse(
    argv.objective || "How many accounts are on Wikipedia?",
    {
      maxTurns: argv.maxIterations || 10,
      schema: z.object({
        numberOfEditors: z
          .number()
          .int()
          .describe("The number of accounts in int format"),
      }),
    }
  );

  // @ts-expect-error - we are not using the full response schema
  console.log("Answer:", answer?.objectiveComplete?.numberOfEditors);

  await browser.close();
}

main();
