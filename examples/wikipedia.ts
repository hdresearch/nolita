import yargs from "yargs/yargs";
import { z } from "zod";

import { AgentBrowser } from "../src/agentBrowser";
import { Logger } from "../src/utils";
import { Browser } from "../src/browser";
import { Agent } from "../src/agent/agent";
import { OpenAIChatApi } from "llm-api";

import { ModelResponseSchema } from "../src/types/browser/actionStep.types";

const parser = yargs(process.argv.slice(2)).options({
  headless: { type: "boolean", default: true },
  objective: { type: "string" },
  startUrl: { type: "string" },
  maxIterations: { type: "number", default: 10 },
});

async function main() {
  const argv = await parser.parse();
  console.log(argv);

  if (!argv.startUrl) {
    throw new Error("url is not provided");
  }

  if (!argv.objective) {
    throw new Error("objective is not provided");
  }

  const logger = new Logger("info");
  const openAIChatApi = new OpenAIChatApi(
    {
      apiKey: process.env.OPENAI_API_KEY,
    },
    { model: "gpt-4" }
  );
  const agent = new Agent(openAIChatApi);
  const browser = await Browser.create(argv.headless);

  const agentBrowser = new AgentBrowser(agent, browser, logger);

  const wikipediaAnswer = ModelResponseSchema.extend({
    numberOfEditors: z
      .number()
      .int()
      .optional()
      .describe("The number of editors in int format"),
  });
  const answer = await agentBrowser.browse(
    {
      startUrl: argv.startUrl,
      objective: [argv.objective],
      maxIterations: argv.maxIterations,
    },
    wikipediaAnswer
  );

  console.log("Answer:", answer?.result);

  await agentBrowser.close();
}

main();
