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

const isValidBoolean = (value: any): boolean => typeof value === "boolean";

const isValidNumber = (value: any, key: string): void => {
  if (typeof value !== "number" || value < 1) {
    throw new Error(`Invalid ${key}.`);
  }
};

const isValidString = (value: any, key: string): void => {
  if (typeof value !== "string") {
    throw new Error(`Invalid ${key}.`);
  }
};

const isValidUrl = (value: string): void => {
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    throw new Error("startUrl must be a valid URL.");
  }
};

const isValidProvider = (value: string): void => {
  if (value !== "openai" && value !== "anthropic") {
    throw new Error("Invalid provider.");
  }
};

const isValidApiKey = (value: string, key: string): void => {
  if (value.length === 0) {
    throw new Error(`${key} not provided.`);
  }
};

const isValidHdrApiKey = (value: string): void => {
  if (value.length > 0 && !value.startsWith("hdr-")) {
    throw new Error("Invalid HDR API key.");
  }
};

const validate = (config: any): void => {
  Object.entries(config).forEach(([key, value]) => {
    if (isValidBoolean(value)) return;

    switch (key) {
      case "inventory":
        return;
      case "maxIterations":
        isValidNumber(value, key);
        return;
      case "startUrl":
        isValidUrl(value as string);
        return;
      case "objective":
      case "agentApiKey":
        isValidString(value, key);
        isValidApiKey(value as string, key);
        return;
      case "agentProvider":
        isValidString(value, key);
        isValidProvider(value as string);
        return;
      case "hdrApiKey":
        isValidString(value, key);
        isValidHdrApiKey(value as string);
        return;
      default:
        isValidString(value, key);
        return;
    }
  });
};

const getConfig = (
  mergedConfig: any,
  startUrl: string | undefined,
  objective: string | undefined,
  maxIterations: number | undefined,
  agentProvider: string | undefined,
  agentModel: string | undefined,
  agentApiKey: string | undefined,
  hdrApiKey: string | undefined,
  headless: boolean | string | undefined,
  hdrDisable: boolean | string | undefined,
  record: boolean | string | undefined,
  replay: string | undefined
): any => ({
  startUrl: startUrl || mergedConfig.startUrl,
  objective: objective || mergedConfig.objective,
  maxIterations: maxIterations || mergedConfig.maxIterations || 10,
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
  record: record ?? mergedConfig.record ?? process.env.HDR_RECORD,
  replay: replay || mergedConfig.replay || process.env.HDR_REPLAY,
});

export const run = async (toolbox: GluegunToolbox) => {
  let {
    startUrl,
    objective,
    maxIterations,
    agentProvider,
    agentModel,
    agentApiKey,
    hdrApiKey,
    headless,
    config,
    hdrDisable,
    record,
    replay
  } = toolbox.parameters.options;

  const mergedConfig = loadConfigs(config);
  const resolvedConfig = getConfig(
    mergedConfig,
    startUrl,
    objective,
    maxIterations,
    agentProvider,
    agentModel,
    agentApiKey,
    hdrApiKey,
    headless,
    hdrDisable,
    record,
    replay
  );
  // default true
  resolvedConfig.headless =
    resolvedConfig.headless !== undefined
      ? resolvedConfig.headless !== "false"
      : true;
  // default false
  resolvedConfig.hdrDisable =
    resolvedConfig.hdrDisable !== undefined
      ? resolvedConfig.hdrDisable !== "false"
      : false;
  resolvedConfig.record = resolvedConfig.record !== undefined ? resolvedConfig.record !== "false" : false;

  if (!resolvedConfig.hdrApiKey && !resolvedConfig.hdrDisable) {
    toolbox.print.muted(
      "No API key for Memory Index provided. Use `npx nolita auth` to authenticate or suppress this message with --hdrDisable."
    );
  }

  if (!resolvedConfig.startUrl && !resolvedConfig.replay) {
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

  if (!resolvedConfig.objective && !resolvedConfig.replay) {
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
    return toolbox.print.error("No model config found. Please use `npx nolita auth` to set one.");
  }

  if (!resolvedConfig.replay) {
    validate(resolvedConfig);
  }

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
      console.log(record 
        ? JSON.stringify({result: parsedInput?.objectiveComplete?.result, record: page.pageId})
        : parsedInput?.objectiveComplete?.result);
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
  if (replay) {
    await page.followRoute(replay, { schema: ModelResponseSchema(ObjectiveComplete) });
  } else {
    await page.goto(resolvedConfig.startUrl);
    await page.browse(resolvedConfig.objective, {
      agent,
      schema: ModelResponseSchema(ObjectiveComplete),
      maxTurns: resolvedConfig.maxIterations,
    });
  }
  await browser.close();
};
