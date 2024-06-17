import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { AgentBrowser } from "../agentBrowser";
import { Browser } from "../browser";
import { Agent } from "../agent/agent";
import { Logger } from "../utils";
import { ModelResponseSchema, ObjectiveComplete } from "../types";
import { Inventory } from "../inventory";
import { completionApiBuilder } from "../agent/config";
import { GluegunToolbox } from "gluegun";
import "dotenv/config";
const MAX_ITERATIONS = 10;

const loadConfigFile = (filePath: string): any => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return {};
  }
};

const loadConfigs = (config: string | undefined): any => {
  const commandLineConfig = loadConfigFile(
    path.resolve(process.cwd(), config || "")
  );
  const homeConfig = loadConfigFile(path.resolve(os.homedir(), ".nolitarc"));
  const mergedConfig = { ...homeConfig, ...commandLineConfig };

  return mergedConfig;
};

const getConfig = (
  mergedConfig: any,
  startUrl: string | undefined,
  objective: string | undefined,
  agentProvider: string | undefined,
  agentModel: string | undefined,
  agentApiKey: string | undefined,
  agentEndpoint: string | undefined,
  hdrApiKey: string | undefined,
  headless: boolean | string | undefined,
  disableMemory: boolean | undefined
): any => ({
  startUrl: startUrl || mergedConfig.startUrl,
  objective: objective || mergedConfig.objective,
  agentProvider:
    agentProvider ||
    mergedConfig.agentProvider ||
    process.env.HDR_AGENT_PROVIDER,
  agentModel:
    agentModel || mergedConfig.agentModel || process.env.HDR_AGENT_MODEL,
  agentApiKey:
    agentApiKey || mergedConfig.agentApiKey || process.env.HDR_AGENT_API_KEY,
  agentEndpoint:
    agentEndpoint ||
    mergedConfig.agentEndpoint ||
    process.env.HDR_AGENT_ENDPOINT,
  hdrApiKey: hdrApiKey || mergedConfig.hdrApiKey || process.env.HDR_API_KEY,
  headless: headless ?? mergedConfig.headless ?? process.env.HDR_HEADLESS,
  inventory: mergedConfig.inventory || [],
  disableMemory: disableMemory || mergedConfig.disableMemory,
});

const writeToNolitarc = (key: string, value: string): void => {
  const nolitarcPath = path.resolve(os.homedir(), ".nolitarc");
  let nolitarc = {};
  try {
    const nolitarcContent = fs.readFileSync(nolitarcPath, "utf8");
    nolitarc = JSON.parse(nolitarcContent);
  } catch (error) {
    // File does not exist or is not valid JSON
  }
  nolitarc = { ...nolitarc, [key]: value };
  fs.writeFileSync(nolitarcPath, JSON.stringify(nolitarc));
};

export const run = async (toolbox: GluegunToolbox) => {
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
    disableMemory,
  } = toolbox.parameters.options;

  const mergedConfig = loadConfigs(config);
  const resolvedConfig = getConfig(
    mergedConfig,
    startUrl,
    objective,
    agentProvider,
    agentModel,
    agentApiKey,
    agentEndpoint,
    hdrApiKey,
    headless,
    disableMemory
  );
  resolvedConfig.headless = resolvedConfig.headless !== "false";

  if (!resolvedConfig.startUrl) {
    await toolbox.prompt
      .ask({
        type: "input",
        name: "startUrl",
        message: "No start URL provided. Where should the session start?",
        initial: "https://",
      })
      .then((answers) => {
        resolvedConfig.startUrl = answers.startUrl;
      });
  }

  if (!resolvedConfig.objective) {
    await toolbox.prompt
      .ask({
        type: "input",
        name: "objective",
        message: "What is the objective of this session?",
      })
      .then((answers) => {
        resolvedConfig.objective = answers.objective;
      });
  }

  if (!resolvedConfig.agentProvider) {
    await toolbox.prompt
      .ask({
        type: "select",
        name: "agentProvider",
        message: "Please specify an LLM provider for the agent",
        choices: ["openai", "anthropic"],
      })
      .then((answers) => {
        resolvedConfig.agentProvider = answers.agentProvider;
      });
  }

  if (
    !resolvedConfig.agentApiKey &&
    resolvedConfig.agentProvider !== "custom" &&
    resolvedConfig.agentProvider !== "ollama"
  ) {
    await toolbox.prompt
      .ask({
        type: "input",
        name: "agentApiKey",
        message: "An API key for your provider is required",
      })
      .then(async (answers) => {
        resolvedConfig.agentApiKey = answers.agentApiKey;
        await toolbox.prompt
          .ask({
            type: "confirm",
            name: "save",
            message: "Would you like to save the API key for future use?",
          })
          .then((answers) => {
            if (answers.save) {
              writeToNolitarc("agentApiKey", resolvedConfig.agentApiKey);
            }
          });
      });
  }

  if (!resolvedConfig.agentModel) {
    await toolbox.prompt
      .ask({
        type: "input",
        name: "agentModel",
        message: "Please specify an LLM model for the agent",
        initial: () => {
          if (resolvedConfig.agentProvider === "openai") {
            return "gpt-4";
          } else if (resolvedConfig.agentProvider === "anthropic") {
            return "claude-2.1";
          } else {
            return "";
          }
        },
      })
      .then((answers) => {
        resolvedConfig.agentModel = answers.agentModel;
      });
  }

  if (!resolvedConfig.hdrApiKey) {
    await toolbox.prompt
      .ask({
        type: "input",
        name: "hdrApiKey",
        message: `Do you have an HDR API key? If so, you can enter it here:`,
      })
      .then(async (answers) => {
        if (!answers.hdrApiKey) {
          return;
        }
        resolvedConfig.hdrApiKey = answers.hdrApiKey;
        await toolbox.prompt
          .ask({
            type: "confirm",
            name: "save",
            message: "Would you like to save the HDR API key for future use?",
          })
          .then((answers) => {
            if (answers.save) {
              writeToNolitarc("hdrApiKey", resolvedConfig.hdrApiKey);
            }
          });
      });
  }
  const spinner = toolbox.print.spin();
  spinner.stop();
  const logger = new Logger(["info"], (input: any) => {
    const parsedInput = JSON.parse(input);
    spinner.text = parsedInput.progressAssessment;
    if (parsedInput?.result) {
      if (parsedInput?.kind === "ObjectiveComplete") {
        spinner.succeed(parsedInput?.result?.objectiveComplete?.result);
        console.log(parsedInput?.result?.objectiveComplete?.result);
      } else if (parsedInput.result.kind === "ObjectiveFailed") {
        spinner.fail(parsedInput?.result?.result);
      }
    }
  });

  const providerOptions = {
    apiKey: resolvedConfig.agentApiKey!,
    provider: resolvedConfig.agentProvider,
    endpoint: resolvedConfig.agentEndpoint,
  };
  const chatApi = completionApiBuilder(providerOptions, {
    model: resolvedConfig.agentModel,
  });

  if (!chatApi) {
    throw new Error(
      `Failed to create chat api for ${providerOptions.provider}`
    );
  }

  const agent = new Agent({
    modelApi: chatApi,
  });

  const args = {
    agent,
    browser: await Browser.launch(resolvedConfig.headless, agent),
    logger,
    inventory:
      resolvedConfig.inventory.length > 0
        ? new Inventory(resolvedConfig.inventory)
        : undefined,
    ...(resolvedConfig.hdrApiKey
      ? {
          collectiveMemoryConfig: {
            endpoint: process.env.HDR_ENDPOINT || "https://api.hdr.is",
            apiKey: resolvedConfig.hdrApiKey,
          },
        }
      : {}),
  };

  const agentBrowser = new AgentBrowser(args);
  spinner.start("Session starting...");
  await agentBrowser.browse(
    {
      startUrl: resolvedConfig.startUrl,
      objective: [resolvedConfig.objective],
      maxIterations: MAX_ITERATIONS,
    },
    ModelResponseSchema(ObjectiveComplete)
  );
  await args.browser.close();
};
