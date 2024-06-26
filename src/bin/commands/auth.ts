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
  const { hdrApiKey } = homeConfig;
  const { print, prompt } = toolbox;
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
