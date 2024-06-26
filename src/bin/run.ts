import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { Browser } from "../browser";
import { Agent } from "../agent/agent";
import { Logger } from "../utils";
import { ModelResponseSchema, ObjectiveComplete } from "../types";
import { Inventory } from "../inventory";
import { completionApiBuilder } from "../agent/config";
import { GluegunToolbox } from "gluegun";
import "dotenv/config";

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

const validate = (config: any): void => {
  Object.entries(config).every(([key, value]) => {
    // Boolean values get checked first.
    if (typeof value === "boolean") {
      return true;
    }
    // Let inventory through.
    if (key === "inventory") {
      return true;
    }
    // Now we validate strings.
    if (typeof value !== "string") {
      throw new Error("Invalid config file.");
    }
    switch (key) {
      case "startUrl":
        if (!value?.startsWith("http://") && !(value?.startsWith("https://"))) {
          throw new Error("startUrl must be a valid URL.");
        }
        break;
      case "objective":
        if (value.length === 0) {
          throw new Error("Objective not provided.");
        }
        break;
      case "agentProvider":
        if (value !== "openai" && value !== "anthropic") {
          throw new Error("Invalid provider.");
        }
        break;
      case "agentApiKey":
        if (value.length === 0) {
          throw new Error("API key not provided.");
        }
        break;
      case "hdrApiKey":
        if (value.length > 0 && !value.startsWith("hdr-")) {
          throw new Error("Invalid HDR API key.");
        }
        break;
      default:
        break;
    }
    return true;
  });
};

const getConfig = (
  mergedConfig: any,
  startUrl: string | undefined,
  objective: string | undefined,
  agentProvider: string | undefined,
  agentModel: string | undefined,
  agentApiKey: string | undefined,
  hdrApiKey: string | undefined,
  headless: boolean | string | undefined,
  hdrDisable: boolean | string | undefined
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
  hdrApiKey: hdrApiKey || mergedConfig.hdrApiKey || process.env.HDR_API_KEY,
  headless: headless ?? mergedConfig.headless ?? process.env.HDR_HEADLESS,
  hdrDisable: hdrDisable ?? mergedConfig.hdrDisable ?? process.env.HDR_DISABLE,
  inventory: mergedConfig.inventory || [],
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
    hdrApiKey,
    headless,
    config,
    hdrDisable,
  } = toolbox.parameters.options;

  const mergedConfig = loadConfigs(config);
  const resolvedConfig = getConfig(
    mergedConfig,
    startUrl,
    objective,
    agentProvider,
    agentModel,
    agentApiKey,
    hdrApiKey,
    headless,
    hdrDisable
  );
  resolvedConfig.headless =
    resolvedConfig.headless !== undefined
      ? resolvedConfig.headless !== "false"
      : true;
  resolvedConfig.hdrDisable =
    resolvedConfig.hdrDisable !== undefined
      ? resolvedConfig.hdrDisable !== "false"
      : false;

  if (!resolvedConfig.hdrApiKey && !resolvedConfig.hdrDisable) {
    toolbox.print.muted(
      "No API key for Memory Index provided. Use `npx nolita auth` to authenticate or suppress this message with --hdrDisable."
    );
  }

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

  validate(resolvedConfig);

  const spinner = toolbox.print.spin();
  spinner.stop();
  const logger = new Logger(["info"], (input: any) => {
    const incMsg = JSON.parse(input);
    let parsedInput;
    try {
      parsedInput = JSON.parse(incMsg?.message);
    } catch (e) {
      parsedInput = incMsg?.message;
    }
    if (typeof parsedInput === "string") {
      spinner.text = parsedInput;
      return;
    }
    spinner.text = parsedInput.progressAssessment;
    if (parsedInput?.["objectiveComplete"]) {
      spinner.succeed();
      console.log(parsedInput?.objectiveComplete?.result);
    } else if (parsedInput?.["objectiveFailed"]) {
      spinner.fail(parsedInput?.objectiveFailed?.result);
    }
  });

  const providerOptions = {
    apiKey: resolvedConfig.agentApiKey!,
    provider: resolvedConfig.agentProvider,
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

  const browser = await Browser.launch(resolvedConfig.headless, agent, logger, {
    disableMemory: resolvedConfig.hdrDisable,
    inventory:
      resolvedConfig.inventory.length > 0
        ? new Inventory(resolvedConfig.inventory)
        : undefined,
    apiKey: resolvedConfig.hdrApiKey || undefined,
  });
  const page = await browser.newPage();

  spinner.start("Session starting...");
  await page.goto(resolvedConfig.startUrl);
  await page.browse(resolvedConfig.objective, {
    agent,
    schema: ModelResponseSchema(ObjectiveComplete),
    maxTurns: 10,
  });
  await browser.close();
};
