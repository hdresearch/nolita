import yargs from "yargs/yargs";
import { z } from "zod";

import { AgentBrowser } from "../src/agentBrowser";
import { Browser } from "../src/browser";
import { Agent } from "../src/agent/agent";
import { completionApiBuilder } from "../src/agent";
import { Logger } from "../src/utils";

import { ModelResponseSchema, ObjectiveComplete } from "../src/types";

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

  const agentBrowser = new AgentBrowser({
    agent: new Agent({ modelApi: chatApi }),
    browser: await Browser.create(argv.headless),
    logger,
  });

  // Here we are defining a custom return schema
  // Custom schemas extrend `ObjectiveComplete` by adding additional fields
  // In addition to returning structured data, we find that using these fields
  // improves the performance of the model by constraining the conditions
  // under which the model can halt
  const wikipediaAnswer = ObjectiveComplete.extend({
    numberOfEditors: z
      .number()
      .int()
      .describe("The number of editors in int format"),
  });
  const answer = await agentBrowser.browse(
    {
      startUrl: argv.startUrl,
      objective: [argv.objective],
      maxIterations: argv.maxIterations,
    },
    ModelResponseSchema(wikipediaAnswer)
  );

  console.log("Answer:", answer?.result);

  await agentBrowser.close();
}

main();
