import { describe, it, expect } from "@jest/globals";
import { Browser } from "../../../src/browser/browser";
import { KnownDevices } from "puppeteer";

describe("Browser", () => {
  it("should create a browser", async () => {
    const browser = await Browser.create(true);
    expect(browser).toBeDefined();

    await browser.close();
  });

  it("should create a new page", async () => {
    const browser = await Browser.create(true);
    const page = await browser.newPage();
    expect(page).toBeDefined();

    await browser.close();
  });

  it("should create a new page with device", async () => {
    const browser = await Browser.create(true);
    const device = KnownDevices["iPhone 6"];
    const page = await browser.newPage(device);
    expect(page).toBeDefined();
    expect(page.page.viewport()).toBe(device.viewport);

    await browser.close();
  });
});
