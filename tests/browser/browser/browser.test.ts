import { describe, it, expect } from "@jest/globals";
import { Browser } from "../../../src/browser/browser";
import { KnownDevices } from "puppeteer";
import { DEFAULT_PROVIDER_CONFIG } from "../../fixtures";

describe("Browser", () => {
  it("should create a browser", async () => {
    const browser = await Browser.launch(true, DEFAULT_PROVIDER_CONFIG);
    expect(browser).toBeDefined();

    await browser.close();
  });

  it("should create a new page", async () => {
    const browser = await Browser.launch(true, DEFAULT_PROVIDER_CONFIG);
    const page = await browser.newPage();
    expect(page).toBeDefined();

    await browser.close();
  });

  it("should create a new page with device", async () => {
    const browser = await Browser.launch(true, DEFAULT_PROVIDER_CONFIG);
    const device = KnownDevices["iPhone 6"];
    const page = await browser.newPage({ device });
    expect(page).toBeDefined();
    expect(page.page.viewport()).toBe(device.viewport);

    await browser.close();
  });

  it("should list pages", async () => {
    const browser = await Browser.launch(true, DEFAULT_PROVIDER_CONFIG);
    const page = await browser.newPage();
    const pages = [...(await browser.pages.values())];
    expect(pages).toContain(page);

    await browser.close();
  });
});
