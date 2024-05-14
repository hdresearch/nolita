import { Browser as PuppeteerBrowser, Device } from "puppeteer";

import { Page } from "./page";
import { BrowserMode } from "../types/browser/browser.types";
import { browserContext } from "./browserUtils";
import { Agent } from "../agent";
import { Logger } from "../utils";

/**
 * Represents a browser session using Puppeteer.
 * Manages the creation of new browser pages and handles the browser instance.
 *
 * @class
 * @property {PuppeteerBrowser} browser - The Puppeteer browser instance.
 * @property {BrowserMode} mode - The mode of the browser which could be headless or non-headless.
 * @property {Agent} agent - The agent instance that interacts with the browser.
 * @property {Logger} [logger] - Optional logger for logging browser activities.
 * @property {string} userDataDir - The directory path for storing user data. Defaults to "/tmp".
 */
export class Browser {
  browser: PuppeteerBrowser;
  mode: BrowserMode;
  agent: Agent;
  logger?: Logger;
  private userDataDir = "/tmp"; // TODO: make this configurable

  /**
   * Initializes a new instance of the Browser class.
   *
   * @param {PuppeteerBrowser} browser - The Puppeteer browser instance.
   * @param {Agent} agent - The agent instance that interacts with the browser.
   * @param {BrowserMode} mode - The mode of the browser (e.g., headless).
   * @param {Logger} [logger] - Optional logger for logging browser activities.
   */
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

  /**
   * Asynchronously launch a new Browser instance with given configuration.
   *
   * @param {boolean} headless - Specifies if the browser should be launched in headless mode.
   * @param {Agent} agent - The agent that will interact with the browser.
   * @param {Logger} [logger] - Optional logger to pass for browser operation logs.
   * @param {string} [browserWSEndpoint] - The WebSocket endpoint to connect to a browser instance.
   * @param {string[]} [browserLaunchArgs] - Additional arguments for launching the browser.
   * @param {BrowserMode} [mode=BrowserMode.text] - The mode of the browser, defaults to text.
   * @returns {Promise<Browser>} A promise that resolves to an instance of Browser.
   */
  static async launch(
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

  /**
   * Asynchronously creates and returns a new Page instance, potentially emulating a specific device.
   *
   * @param {string} [pageId] - Optional identifier for the new page.
   * @param {Device} [device] - Optional device to emulate in the new page.
   * @returns {Promise<Page>} A promise that resolves to the newly created Page instance.
   */
  async newPage(pageId?: string, device?: Device): Promise<Page> {
    const basePage = await this.browser.newPage();
    if (device) {
      await basePage.emulate(device);
    }
    return new Page(basePage, this.agent, { pageId, logger: this.logger });
  }

  /**
   * Closes all pages and the browser instance.
   *
   * @returns {Promise<void>} A promise that resolves when all pages and the browser have been closed.
   */
  async close() {
    const pages = await this.browser.pages();
    await Promise.all(pages.map((page) => page.close()));
    await this.browser.close();
  }
}
