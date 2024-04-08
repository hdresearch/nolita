#! /usr/bin/env node

import { build, GluegunToolbox } from "gluegun";
import path from "path";
import { AgentBrowser } from "../agentBrowser";
import { Browser } from "../browser";
import { Agent } from "../agent/agent";
import { Logger } from "../utils";
import { ModelResponseSchema } from "../types/browser/actionStep.types";
import { Inventory } from "../inventory";
import { completionApiBuilder } from "../agent/config";

const cli = build()
  .brand("hdr")
  .src(__dirname)
  .plugins("./node_modules", { matching: "hdr-*", hidden: true })
  .defaultCommand(async (toolbox: GluegunToolbox) => {
    let {
      startUrl,
      objective,
      agentProvider,
      agentModel,
      agentApiKey,
      agentEndpoint,
      hdrApiKey,
      headless,
      config,
    } = toolbox.parameters.options;
    let inventory: { value: string; name: string; type: string }[] = [];
    // if a config file is provided, parse it
    if (config) {
      const importedConfig = require(path.resolve(process.cwd(), config));
      startUrl = startUrl || importedConfig.startUrl;
      objective = objective || importedConfig.objective;
      agentProvider =
        agentProvider ||
        importedConfig.agentProvider ||
        process.env.HDR_AGENT_PROVIDER;
      agentModel =
        agentModel || importedConfig.agentModel || process.env.HDR_AGENT_MODEL;
      agentApiKey =
        agentApiKey ||
        importedConfig.agentApiKey ||
        process.env.HDR_AGENT_API_KEY;
      agentEndpoint =
        agentEndpoint ||
        importedConfig.agentEndpoint ||
        process.env.HDR_AGENT_ENDPOINT;
      hdrApiKey =
        hdrApiKey || importedConfig.hdrApiKey || process.env.HDR_API_KEY;
      headless =
        headless !== undefined
          ? headless
          : importedConfig?.headless
          ? importedConfig.headless
          : process.env.HDR_HEADLESS === "true" || true;
      inventory = importedConfig.inventory || [];
    }

    headless =
      headless !== undefined
        ? headless
        : process.env.HDR_HEADLESS === "true" || true;

    if (!startUrl) {
      await toolbox.prompt
        .ask({
          type: "input",
          name: "startUrl",
          message: "No start URL provided. Where should the session start?",
          initial: "https://",
        })
        .then((answers) => {
          startUrl = answers.startUrl;
        });
    }

    if (!objective) {
      await toolbox.prompt
        .ask({
          type: "input",
          name: "objective",
          message: "What is the objective of this session?",
        })
        .then((answers) => {
          objective = answers.objective;
        });
    }

    if (!agentProvider) {
      await toolbox.prompt
        .ask({
          type: "select",
          name: "agentProvider",
          message: "Please specify an LLM provider for the agent",
          choices: ["openai", "anthropic"],
        })
        .then((answers) => {
          agentProvider = answers.agentProvider;
        });
    }

    if (
      !agentApiKey &&
      agentProvider !== "custom" &&
      agentProvider !== "ollama"
    ) {
      await toolbox.prompt
        .ask({
          type: "input",
          name: "agentApiKey",
          message: "An API key for your provider is required",
        })
        .then((answers) => {
          agentApiKey = answers.agentApiKey;
        });
    }

    //   if (!agentEndpoint) {
    //     // come back when ollama is ready
    //     if (agentProvider !== "openai" && agentProvider !== "anthropic") {
    //       throw new Error("No agent endpoint provided");
    //     }
    //     // if (agentProvider === "ollama") {
    //     //   agentEndpoint = "http://localhost:11434/api/generate";
    //     // }
    //   }

    if (!agentModel) {
      await toolbox.prompt
        .ask({
          type: "input",
          name: "agentModel",
          message: "Please specify an LLM model for the agent",
          initial: () => {
            if (agentProvider === "openai") {
              return "gpt-4";
            } else if (agentProvider === "anthropic") {
              return "claude-2.1";
            } else {
              return "";
            }
          },
        })
        .then((answers) => {
          agentModel = answers.agentModel;
        });
    }
    // if no HDR key, we already console.log about it in the agent browser
    const logger = new Logger("info");

    const providerOptions = {
      apiKey: agentApiKey!,
      provider: agentProvider,
      endpoint: agentEndpoint,
    };
    const chatApi = completionApiBuilder(providerOptions, {
      model: agentModel,
    });

    if (!chatApi) {
      throw new Error(
        `Failed to create chat api for ${providerOptions.provider}`
      );
    }

    const inventoryObject = new Inventory(inventory);
    const agent = new Agent(chatApi);
    const browser = await Browser.create(headless);
    const agentBrowser = new AgentBrowser(
      agent,
      browser,
      logger,
      inventory.length > 0 ? inventoryObject : undefined
    );
    const answer = await agentBrowser.browse(
      {
        startUrl,
        objective: [objective],
        maxIterations: 10,
      },
      ModelResponseSchema
    );
    process.stdout.write(JSON.stringify(answer));
    await browser.close();
  })
  .create()
  .run()
  .then(() => {
    process.exit(0);
  });
