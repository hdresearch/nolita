import { Browser as PuppeteerBrowser, Device } from "puppeteer";

import { Page } from "./page";
import { BrowserMode } from "../types/browser/browser.types";
import { browserContext } from "./browserUtils";

export class Browser {
  // @ts-ignore
  private browser: PuppeteerBrowser;
  //@ts-ignore
  page: Page;
  // @ts-ignore
  private mode: BrowserMode;
  private userDataDir = "/tmp"; // TODO: make this configurable
  device?: Device;

  constructor() {}

  private async init(
    browser: PuppeteerBrowser,
    mode: BrowserMode,
    device?: Device
  ) {
    this.browser = browser;
    this.page = await this.newPage();
    this.mode = mode;
    this.device = device;
    let self = this;

    // this helps us work when links are opened in new tab
    this.browser.on("targetcreated", async function (target) {
      let pPage = await target.page();

      if (pPage) {
        self.page = new Page(pPage);
      }
    });
  }

  static async create(
    headless: boolean,
    browserWSEndpoint?: string,
    mode: BrowserMode = BrowserMode.text,
    device?: Device
  ): Promise<Browser> {
    const browser = new Browser();

    await browser.init(
      await browserContext(headless, browserWSEndpoint),
      mode,
      device
    );

    return browser;
  }

  async newPage(): Promise<Page> {
    const basePage = await this.browser.newPage();
    if (this.device) {
      await basePage.emulate(this.device);
    }
    return new Page(basePage);
  }
}
