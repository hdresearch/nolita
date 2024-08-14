import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { input, confirm, select } from '@inquirer/prompts';
import { open } from "out-url";

const loadConfigFile = (filePath: string): any => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return {};
  }
};

const writeToNolitarc = (key: string, value: string): void => {
  const nolitarcPath = path.resolve(os.homedir(), '.nolitarc');
  let nolitarc = {};
  try {
    const nolitarcContent = fs.readFileSync(nolitarcPath, 'utf8');
    nolitarc = JSON.parse(nolitarcContent);
  } catch (error) {
    // File does not exist or is not valid JSON
  }
  nolitarc = { ...nolitarc, [key]: value };
  fs.writeFileSync(nolitarcPath, JSON.stringify(nolitarc));
};

const handleModelConfig = async (homeConfig: any) => {
  const { agentProvider } = homeConfig;

  if (!agentProvider) {
    console.error('No model config found in ~/.nolitarc.');
    const model = await confirm({
      message: 'Would you like to set a model config?',
    });

    if (model) {
      const provider = await select({
        message: 'Please select an agent provider.',
        choices: [{
          name: 'OpenAI',
          value: 'openai',
        }, {
          name: 'Anthropic',
          value: 'anthropic',
        }],
      });
      const apiKey = await input({
        message: 'Please enter your provider API key.',
      });
      const model = await input({
        message: 'Please enter your model name.',
        default: 'gpt-4',
      });
      writeToNolitarc('agentProvider', provider);
      writeToNolitarc('agentApiKey', apiKey);
      writeToNolitarc('agentModel', model);
    }
  } else {
    console.log('Model config found in ~/.nolitarc.');
    const deleteConfig = await confirm({
      message: 'Delete model config?',
    });

    if (deleteConfig) {
      writeToNolitarc('agentProvider', '');
      writeToNolitarc('agentApiKey', '');
      writeToNolitarc('agentModel', '');
      console.log('Model config deleted.');
    }
  }
};

const handleHDRApiKey = async (homeConfig: any) => {
  const { hdrApiKey } = homeConfig;

  if (!hdrApiKey) {
    console.error('No HDR API key found in ~/.nolitarc.');
    const create = await confirm({
      message: 'Would you like to sign up at dashboard.hdr.is?',
    });

    if (create) {
      open('https://dashboard.hdr.is');
    }

    const apiKey = await input({
      message:
        'Please access https://dashboard.hdr.is/keys and enter your generated HDR API key.',
    });
    writeToNolitarc('hdrApiKey', apiKey);
  } else {
    console.log('HDR API key found in ~/.nolitarc.');
    const deleteKey = await confirm({
      message: 'Delete HDR API key?',
    });

    if (deleteKey) {
      writeToNolitarc('hdrApiKey', '');
      console.log('HDR API key deleted.');
    }
  }
};

export const run = async () => {
  const homeConfig = loadConfigFile(path.resolve(os.homedir(), '.nolitarc'));

  await handleModelConfig(homeConfig);
  await handleHDRApiKey(homeConfig);
};