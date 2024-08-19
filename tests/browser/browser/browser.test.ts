import { describe, it, expect, beforeAll } from "@jest/globals";
import { Browser } from "../../../src/browser/browser";
import { KnownDevices } from "puppeteer";
import { Agent } from "../../../src/agent";
import { DEFAULT_PROVIDER_CONFIG } from "../../fixtures";

describe("Browser", () => {
  let agent: Agent;

  beforeAll(async () => {
    agent = new Agent({ providerConfig: DEFAULT_PROVIDER_CONFIG });
  });

  it("should create a browser", async () => {
    const browser = await Browser.launch(true, agent);
    expect(browser).toBeDefined();

    await browser.close();
  });

  it("should create a new page", async () => {
    const browser = await Browser.launch(true, agent);
    const page = await browser.newPage();
    expect(page).toBeDefined();

    await browser.close();
  });

  it("should create a new page with device", async () => {
    const browser = await Browser.launch(true, agent);
    const device = KnownDevices["iPhone 6"];
    const page = await browser.newPage({ device });
    expect(page).toBeDefined();
    expect(page.page.viewport()).toBe(device.viewport);

    await browser.close();
  });

  it("should list pages", async () => {
    const browser = await Browser.launch(true, agent);
    const page = await browser.newPage();
    const pages = [...(await browser.pages.values())];
    expect(pages).toContain(page);

    await browser.close();
  });
});
