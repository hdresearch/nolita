#! /usr/bin/env node
import { AgentBrowser } from "../src/agentBrowser";
import yargs from "yargs/yargs";
import inquirer from "inquirer";

const parser = yargs(process.argv.slice(2)).options({
  startUrl: { type: "string" },
  objective: { type: "string" },
  agentProvider: { type: "string" },
  agentModel: { type: "string" },
  agentApiKey: { type: "string" },
  agentEndpoint: { type: "string" },
  hdrApiKey: { type: "string" },
  headless: { type: "boolean", default: true },
});

export async function main() {
  const argv = await parser.parse();
  let {
    startUrl,
    objective,
    agentProvider,
    agentModel,
    agentApiKey,
    agentEndpoint,
    hdrApiKey,
    headless,
  } = argv;
  agentProvider = agentProvider || process.env.HDR_AGENT_PROVIDER;
  agentModel = agentModel || process.env.HDR_AGENT_MODEL;
  agentApiKey = agentApiKey || process.env.HDR_AGENT_API_KEY;
  agentEndpoint = agentEndpoint || process.env.HDR_AGENT_ENDPOINT;
  hdrApiKey = hdrApiKey || process.env.HDR_API_KEY;
  headless = headless || process.env.HDR_HEADLESS === "true";

  // no URL or objective? remind the user
  if (!startUrl) {
    inquirer
      .prompt([
        {
          type: "input",
          name: "startUrl",
          message: "No start URL provided. Where should the session start?",
        },
      ])
      .then((answers) => {
        startUrl = answers.startUrl;
      });
  }

  if (!objective) {
    inquirer
      .prompt([
        {
          type: "input",
          name: "objective",
          message: "What is the objective of this session?",
        },
      ])
      .then((answers) => {
        objective = answers.objective;
      });
  }

  if (!agentProvider) {
    throw new Error("No agent provider provided");
  }

  if (
    !agentApiKey &&
    agentProvider !== "custom" &&
    agentProvider !== "ollama"
  ) {
    throw new Error("No agent API key provided");
  }

  if (!agentEndpoint) {
    if (agentProvider === "custom") {
      throw new Error("No agent endpoint provided");
    }
    if (agentProvider === "ollama") {
      agentEndpoint = "http://localhost:11434/api/generate";
    }
  }

  if (!agentModel) {
    // should we fallback in this script or in the agent browser itself?
    // we can dictate provider default somewhere or be defensive and just
    // assume at multiple steps / throw an error
    throw new Error("No agent model provided");
  }
  // if no HDR key, we already console.log about it in the agent browser
//   const browser = await AgentBrowser.create(
//     headless,
//     objective,
//     agentProvider,
//     agentModel,
//     agentApiKey,
//     agentEndpoint,
//     hdrApiKey,
//   );
//   await browser.goTo(startUrl);
}
