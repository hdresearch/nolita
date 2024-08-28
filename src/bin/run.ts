import * as path from "path";
import * as os from "os";
import * as fs from "fs";

import "dotenv/config";
import { input } from "@inquirer/prompts";
import ora from "ora";

import { Browser } from "../browser";
import { Agent } from "../agent/agent";
import { Logger } from "../utils";
import { ModelResponseSchema, ObjectiveComplete } from "../types";
import { Inventory } from "../inventory";



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
  if (value !== "openai" && value !== "anthropic" && value !== "ollama" && value !== "local") {
    throw new Error("Invalid provider.");
  }
};

const isValidHdrApiKey = (value: string): void => {
  if (typeof value !== "string") {
    return;
  }
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
        isValidString(value, key);
        return;
      case "agentApiKey":
        isValidString(value, key);
        return;
      case "agentProvider":
        isValidString(value, key);
        isValidProvider(value as string);
        return;
      case "hdrApiKey":
        isValidHdrApiKey(value as string);
        return;
      default:
        return;
    }
  });
};

const getConfig = (
  mergedConfig: any,
  argv: any
): any => ({
  startUrl: argv.startUrl || mergedConfig.startUrl,
  objective: argv.objective || mergedConfig.objective,
  maxIterations: argv.maxIterations || mergedConfig.maxIterations || 10,
  agentProvider:
    argv.agentProvider ||
    mergedConfig.agentProvider ||
    process.env.HDR_AGENT_PROVIDER,
  agentModel:
    argv.agentModel || mergedConfig.agentModel || process.env.HDR_AGENT_MODEL,
  agentApiKey:
    (argv.agentApiKey || mergedConfig.agentApiKey) ?? process.env.HDR_AGENT_API_KEY,
  hdrApiKey: argv.hdrApiKey || mergedConfig.hdrApiKey || process.env.HDR_API_KEY,
  headless: argv.headless ?? mergedConfig.headless ?? process.env.HDR_HEADLESS,
  hdrDisable: argv.hdrDisable ?? mergedConfig.hdrDisable ?? process.env.HDR_DISABLE,
  inventory: mergedConfig.inventory || [],
  record: argv.record ?? mergedConfig.record ?? process.env.HDR_RECORD,
  replay: argv.replay || mergedConfig.replay || process.env.HDR_REPLAY,
});

export const run = async (argv: any) => {
  const mergedConfig = loadConfigs(argv.config);
  const resolvedConfig = getConfig(mergedConfig, argv);
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
  resolvedConfig.record =
    resolvedConfig.record !== undefined
      ? resolvedConfig.record !== "false"
      : false;

  if (!resolvedConfig.hdrApiKey && !resolvedConfig.hdrDisable) {
    console.log(
      "No API key for Memory Index provided. Use `npx nolita auth` to authenticate or suppress this message with --hdrDisable."
    );
  }

  if (!resolvedConfig.startUrl && !resolvedConfig.replay) {
    resolvedConfig.startUrl = await promptForInput(
      "No start URL provided. Where should the session start?",
      "https://"
    );
  }

  if (!resolvedConfig.objective && !resolvedConfig.replay) {
    resolvedConfig.objective = await promptForInput(
      "What is the objective of this session?"
    );
  }

  if (!resolvedConfig.agentProvider) {
    console.error(
      "No model config found. Please use `npx nolita auth` to set one."
    );
    process.exit(1);
  }

  if (!resolvedConfig.replay) {
    validate(resolvedConfig);
  }

  const spinner = ora("Session starting...").start();

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
      console.log(
        resolvedConfig.record
          ? JSON.stringify({
              result: parsedInput?.objectiveComplete?.result,
              record: page.pageId,
            })
          : parsedInput?.objectiveComplete?.result
      );
    } else if (parsedInput?.["objectiveFailed"]) {
      spinner.fail(parsedInput?.objectiveFailed?.result);
    }
  });

  const providerOptions = {
    apiKey: resolvedConfig.agentApiKey!,
    provider: resolvedConfig.agentProvider,
    model: resolvedConfig.agentModel,
  };

  const agent = new Agent({
    providerConfig: providerOptions,
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

  if (resolvedConfig.replay) {
    await page.followRoute(resolvedConfig.replay, {
      schema: ModelResponseSchema(ObjectiveComplete),
    });
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

const promptForInput = async (message: string, initial?: string): Promise<string> => {
  const answer = await input({
      message,
      default: initial,
    },
  );
  return answer;
};