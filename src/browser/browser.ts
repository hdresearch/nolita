import { Browser as PuppeteerBrowser, Device } from "puppeteer";

import { Page } from "./page";
import { BrowserMode } from "../types/browser/browser.types";
import { browserContext } from "./browserUtils";

export class Browser {
  // @ts-ignore
  private browser: PuppeteerBrowser;
  // @ts-ignore
  mode: BrowserMode;
  private userDataDir = "/tmp"; // TODO: make this configurable

  constructor() {}

  private async init(browser: PuppeteerBrowser, mode: BrowserMode) {
    this.browser = browser;
    this.mode = mode;
  }

  static async create(
    headless: boolean,
    browserWSEndpoint?: string,
    browserLaunchArgs?: string[],
    mode: BrowserMode = BrowserMode.text
  ): Promise<Browser> {
    const browser = new Browser();

    await browser.init(
      await browserContext(headless, browserWSEndpoint, browserLaunchArgs),
      mode
    );

    return browser;
  }

  async newPage(device?: Device): Promise<Page> {
    const basePage = await this.browser.newPage();
    if (device) {
      await basePage.emulate(device);
    }
    return new Page(basePage);
  }

  async close() {
    const pages = await this.browser.pages();
    await Promise.all(pages.map((page) => page.close()));
    await this.browser.close();
  }
}
