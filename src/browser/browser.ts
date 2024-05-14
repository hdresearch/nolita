import { Browser as PuppeteerBrowser, Device } from "puppeteer";

import { Page } from "./page";
import { BrowserMode } from "../types/browser/browser.types";
import { browserContext } from "./browserUtils";
import { Agent } from "../agent";
import { Logger } from "../utils";

export class Browser {
  browser: PuppeteerBrowser;
  mode: BrowserMode;
  agent: Agent;
  logger?: Logger;
  private userDataDir = "/tmp"; // TODO: make this configurable

  constructor(
    browser: PuppeteerBrowser,
    agent: Agent,
    mode: BrowserMode,
    logger?: Logger
  ) {
    this.agent = agent;
    this.browser = browser;
    this.mode = mode;
    this.logger = logger;
  }

  static async create(
    headless: boolean,
    agent: Agent,
    logger?: Logger,
    browserWSEndpoint?: string,
    browserLaunchArgs?: string[],
    mode: BrowserMode = BrowserMode.text
  ): Promise<Browser> {
    const browser = new Browser(
      await browserContext(headless, browserWSEndpoint, browserLaunchArgs),
      agent,
      mode,
      logger
    );

    return browser;
  }

  async newPage(pageId?: string, device?: Device): Promise<Page> {
    const basePage = await this.browser.newPage();
    if (device) {
      await basePage.emulate(device);
    }
    return new Page(basePage, this.agent, { pageId, logger: this.logger });
  }

  async close() {
    const pages = await this.browser.pages();
    await Promise.all(pages.map((page) => page.close()));
    await this.browser.close();
  }
}
