import * as chromePaths from "chrome-paths";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import puppeteer from "puppeteer-extra";
import fs from "fs";

import { Browser as PuppeteerBrowser } from "puppeteer";
import { BROWSER_LAUNCH_ARGS } from "./browserDefaults";

puppeteer.use(StealthPlugin());

/**
 * Retrieves the path to the Chrome executable.
 * Checks the environment variable `CHROME_PATH` first, and if not set, defaults to the path from the `chrome-paths` module.
 *
 * @returns {string | undefined} The path to the Chrome executable, or undefined if not found.
 */
export const getChromePath = (): string | undefined => {
  let chromePath;
  if (process.env.CHROME_PATH) {
    chromePath = process.env.CHROME_PATH;
  } else {
    chromePath = chromePaths.chrome;
  }
  if (chromePath === undefined || !fs.existsSync(chromePath)) {
    return undefined;
  }
  return chromePath;
};

/**
 * Creates a new browser context.
 * Connects to an existing browser if `browserWSEndpoint` is provided, otherwise launches a new browser instance.
 *
 * @param {boolean} headless - Specifies if the browser should be launched in headless mode.
 * @param {string} [browserWSEndpoint] - Optional WebSocket endpoint to connect to an existing browser.
 * @param {string[]} [browserLaunchArgs] - Optional arguments for launching the browser.
 * @returns {Promise<PuppeteerBrowser>} A promise that resolves to the Puppeteer browser instance.
 */
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
    browser = await puppeteer.launch({
      headless: headless,
      executablePath: getChromePath(),
      args: browserLaunchArgs ?? BROWSER_LAUNCH_ARGS,
    });
  }
  return browser;
};
