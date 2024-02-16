import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { Browser } from "../../src/browser/index";
import { BrowserMode } from "../../src/types/browser.types";

describe("Vision Browser", () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await Browser.create(true, "", BrowserMode.vision);
  });

  afterAll(async () => {
    await browser.close();
  });

  test("Bounding boxes are injected correctly", async () => {
    await browser.goTo("https://example.com");

    await browser.injectBoundingBoxes();
    console.log("HELLO");
    await new Promise((resolve) => setTimeout(resolve, 100));

    const markersCount = await browser.page.evaluate(() => {
      let count = 0;
      for (let index = 0; ; index++) {
        const element = document.getElementById(`ai-label-${index}`);
        if (!element) break;
        count++;
      }
      return count;
    });
    expect(markersCount).toBeGreaterThan(0);
    expect(markersCount).toBe(1);
  });
});
