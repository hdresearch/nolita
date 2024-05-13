import * as chromePaths from "chrome-paths";
import PuppeteerExtra from "puppeteer-extra";
import puppeteer, { Browser as PuppeteerBrowser } from "puppeteer";
import { BROWSER_LAUNCH_ARGS } from "./browserDefaults";

export const getChromePath = (): string | undefined => {
  let chromePath;
  if (process.env.CHROME_PATH) {
    chromePath = process.env.CHROME_PATH;
  } else {
    chromePath = chromePaths.chrome;
  }
  return chromePath;
};

export const browserContext = async (
  headless: boolean,
  browserWSEndpoint?: string,
  browserLaunchArgs?: string[]
) => {
  let browser: PuppeteerBrowser;
  if (browserWSEndpoint) {
    browser = await puppeteer.connect({
      browserWSEndpoint,
    });
  } else {
    browser = await PuppeteerExtra.launch({
      headless: headless,
      executablePath: getChromePath(),
      args: browserLaunchArgs ?? BROWSER_LAUNCH_ARGS,
    });
  }
  return browser;
};
