const chromePaths = require("chrome-paths");
import PuppeteerExtra from "puppeteer-extra";
import puppeteer, { Browser as PuppeteerBrowser } from "puppeteer";

export const getChromePath = () => {
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
  browserWSEndpoint: string
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
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browser;
};
