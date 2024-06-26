import { GluegunToolbox } from "gluegun";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
const { open } = require("out-url");

const loadConfigFile = (filePath: string): any => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return {};
  }
};

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
  const homeConfig = loadConfigFile(path.resolve(os.homedir(), ".nolitarc"));
  const { hdrApiKey, agentProvider } = homeConfig;
  const { print, prompt } = toolbox;

  if (!agentProvider) {
    print.error("No model config found in ~/.nolitarc.");
    await prompt
      .ask({
        type: "confirm",
        name: "model",
        message: "Would you like to set a model config?",
      })
      .then(async ({ model }) => {
        if (model) {
          const { provider, apiKey } = await prompt.ask([
            {
              type: "select",
              name: "provider",
              message: "Please select an agent provider.",
              choices: ["openai", "anthropic"],
            },
            {
              type: "input",
              name: "apiKey",
              message: "Please enter your provider API key.",
            },
            {
              type: "input",
              name: "model",
              message: "Please enter your model name.",
              initial: "gpt-4"
            }
          ]);
          writeToNolitarc("agentProvider", provider);
          writeToNolitarc("agentApiKey", apiKey);
          writeToNolitarc("agentModel", model);
        }
      });
  }

  if (agentProvider) {
    print.success("Model config found in ~/.nolitarc.");
    await prompt
      .ask({
        type: "confirm",
        name: "delete",
        message: "Delete model config?",
      })
      .then(({ delete: del }) => {
        if (del) {
          writeToNolitarc("agentProvider", "");
          writeToNolitarc("agentApiKey", "");
          writeToNolitarc("agentModel", "");
          print.success("Model config deleted.");
        }
      });
  }

  if (!hdrApiKey) {
    print.error("No HDR API key found in ~/.nolitarc.");
    await prompt
      .ask({
        type: "confirm",
        name: "create",
        message: "Would you like to sign up at dashboard.hdr.is?",
      })
      .then(async ({ create }) => {
        if (create) {
          open("https://dashboard.hdr.is");
        }
      });
    const { apiKey } = await prompt.ask({
      type: "input",
      name: "apiKey",
      message:
        "Please access https://dashboard.hdr.is/keys and enter your generated HDR API key.",
    });
    writeToNolitarc("hdrApiKey", apiKey);
  }

  if (hdrApiKey) {
    print.success("HDR API key found in ~/.nolitarc.");
    await prompt
      .ask({
        type: "confirm",
        name: "delete",
        message: "Delete HDR API key?",
      })
      .then(({ delete: del }) => {
        if (del) {
          writeToNolitarc("hdrApiKey", "");
          print.success("HDR API key deleted.");
        }
      });
  }
};
