import { describe, expect, test, beforeAll, afterAll } from "@jest/globals";
import { Browser } from "../../src/browser/index";
import { BrowserMode, ObjectiveState } from "../../src/types/browser.types";

describe("Base browser functionality", () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await Browser.create(true, "", BrowserMode.text);
  });

  afterAll(async () => {
    await browser.close();
  });

  test("Can navigate to a page", async () => {
    await browser.goTo("https://example.com");
    const url = await browser.page.url();
    expect(url).toBe("https://example.com/");
  });

  test(".url returns page url", async () => {
    await browser.goTo("https://example.com");
    const url = await browser.url();
    expect(url).toBe("https://example.com/");
  });

  test("State returns correctly", async () => {
    await browser.goTo("https://example.com");
    const state = await browser.state("Describe the page content", []);
    const expectedState: ObjectiveState = {
      ariaTree:
        '[0,"RootWebArea","Example Domain",[[1,"heading","Example Domain"],"This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.",[2,"link","More information..."]]]',
      kind: "ObjectiveState",
      objective: "Describe the page content",
      progress: [],
      url: "https://example.com/",
    };
    expect(state).toStrictEqual(expectedState);
    expect(state.ariaTree).toBe(expectedState.ariaTree);
    expect(state.url).toBe(expectedState.url);
    expect(state.progress).toStrictEqual(expectedState.progress);
    expect(state.kind).toBe(expectedState.kind);
    expect(state.objective).toBe(expectedState.objective);
  });
});

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
