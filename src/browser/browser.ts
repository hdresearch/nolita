import { Browser as PuppeteerBrowser, Device } from "puppeteer";

import { Page } from "./page";
import { BrowserMode } from "../types/browser";
import { browserContext } from "./browserUtils";
import { Agent } from "../agent";
import { Logger } from "../utils";
import { Inventory } from "../inventory";
import { nolitarc } from "../utils/config";

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
  private apiKey: string | undefined;
  private endpoint: string | undefined;
  pages: Map<string, Page> = new Map<string, Page>();
  private inventory: Inventory | undefined;
  private disableMemory: boolean = false;

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
   * @param {Logger} [logger] - Optional logger for logging browser activities.
   * @param {Object} [opts] - Optional configuration options for the browser.
   * @param {string} [opts.apiKey] - The API key for the browser.
   * @param {string} [opts.endpoint] - The HDR collective memory endpoint.
   * @param {Inventory} [opts.inventory] - The inventory to use for the browser.
   * @param {BrowserMode} [opts.mode=BrowserMode.text] - The mode of the browser (e.g., text).
   * @param {boolean} [opts.disableMemory=false] - Specifies if the browser should disable memory.
   */
  constructor(
    browser: PuppeteerBrowser,
    agent: Agent,
    logger?: Logger,
    opts?: {
      mode?: BrowserMode;
      apiKey?: string;
      endpoint?: string;
      inventory?: Inventory;
      disableMemory?: boolean;
    }
  ) {
    const { hdrApiKey } = nolitarc();
    this.disableMemory = opts?.disableMemory || false;
    this.apiKey = opts?.apiKey || hdrApiKey || process.env.HDR_API_KEY;
    this.endpoint = opts?.endpoint || process.env.HDR_ENDPOINT;

    this.agent = agent;
    this.browser = browser;
    this.mode = opts?.mode || BrowserMode.text;
    this.logger = logger;

    this.inventory = opts?.inventory;
  }

  /**
   * Asynchronously launch a new Browser instance with given configuration.
   *
   * @param {boolean} headless - Specifies if the browser should be launched in headless mode.
   * @param {Agent} agent - The agent that will interact with the browser.
   * @param {Logger} [logger] - Optional logger to pass for browser operation logs.
   * @param {object} [opts] - Optional configuration options for launching the browser.
   * @param {string} [opts.browserWSEndpoint] - The WebSocket endpoint to connect to a browser instance.
   * @param {string[]} [opts.browserLaunchArgs] - Additional arguments for launching the browser.
   * @param {BrowserMode} [opts.mode=BrowserMode.text] - The mode of the browser, defaults to text.
   * @param {string} [opts.apiKey] - The API key for the browser.
   * @param {string} [opts.endpoint] - The HDR collective memory endpoint.
   * @param {Inventory} [opts.inventory] - The inventory to use for the browser.
   * @param {boolean} [opts.disableMemory=false] - Specifies if the browser should disable memory.
   * @returns {Promise<Browser>} A promise that resolves to an instance of Browser.
   */
  static async launch(
    headless: boolean,
    agent: Agent,
    logger?: Logger,
    opts?: {
      browserWSEndpoint?: string;
      browserLaunchArgs?: string[];
      mode?: BrowserMode;
      apiKey?: string;
      endpoint?: string;
      inventory?: Inventory;
      disableMemory?: boolean;
    }
  ): Promise<Browser> {
    const browser = new Browser(
      await browserContext(
        headless,
        opts?.browserWSEndpoint,
        opts?.browserLaunchArgs
      ),
      agent,
      logger,
      opts
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
  async newPage(opts?: {
    pageId?: string;
    agent?: Agent;
    device?: Device;
    inventory?: Inventory;
    disableMemory?: boolean;
  }): Promise<Page> {
    const basePage = await this.browser.newPage();
    if (opts?.device) {
      await basePage.emulate(opts.device);
    }

    const agent = opts?.agent ?? this.agent;
    const page = new Page(basePage, agent, {
      pageId: opts?.pageId,
      logger: this.logger,
      apiKey: this.apiKey,
      endpoint: this.endpoint,
      inventory: opts?.inventory ?? this.inventory,
      disableMemory: opts?.disableMemory ?? this.disableMemory,
    });

    this.pages.set(page.pageId, page);

    return page;
  }

  /**
   * Closes all pages and the browser instance.
   * @returns {Promise<void>} A promise that resolves when all pages and the browser have been closed.
   */
  async close() {
    const pages = await [...this.pages.values()];
    await Promise.all(
      pages.map(async (page) => {
        try {
          return await page.close();
        } catch (error) {
          if (
            (error as Error).message ===
            "Protocol error: Connection closed. Most likely the page has been closed."
          ) {
            return;
          }
        }
      })
    );

    await this.browser.close();
  }
}
