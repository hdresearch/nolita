import {
  describe,
  expect,
  test,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import { Browser } from "../../src/browser/index";
import { BrowserMode, ObjectiveState } from "../../src/types/browser.types";

describe("Base browser functionality", () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await Browser.create(true, "", BrowserMode.text);
    await browser.goTo("https://example.com");
  });

  afterAll(async () => {
    await browser.close();
  });

  test("Can navigate to a page", async () => {
    // creating a new browser to test the goTo function
    const _browser = await Browser.create(true, "", BrowserMode.text);
    await _browser.goTo("https://example.com");
    const url = await _browser.page.url();
    expect(url).toBe("https://example.com/");
    await _browser.close();
  });

  test(".url returns page url", async () => {
    const url = await browser.url();
    expect(url).toBe("https://example.com/");
  });

  test("State returns correctly", async () => {
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

  test("Content should return correctly", async () => {
    const content = await browser.content();
    // multiple calls so we dont have to mess with the base string
    expect(content).toContain("Example Domain");
    expect(content).toContain(
      "This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission"
    );
    expect(content).toContain("More information...");
  });

  test("parseContent", async () => {
    const content = await browser.parseContent();
    const want =
      '[0,"RootWebArea","Example Domain",[[1,"heading","Example Domain"],"This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.",[2,"link","More information..."]]]';
    expect(content).toBe(want);
  });

  test("idMapping", async () => {
    await browser.parseContent();
    const map = await browser.getMap();
    expect(map.get(2)).toStrictEqual([2, "link", "More information..."]);
  });
});

describe("Browser interaction tests", () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await Browser.create(true, "", BrowserMode.text);
  });

  beforeEach(async () => {
    await browser.goTo("https://google.com");
    await browser.parseContent();
  });

  afterAll(async () => {
    await browser.close();
  });

  test("Click Link", async () => {
    await browser.performAction({ kind: "Click", index: 1 });
    // sleep for a bit to let the page load
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const url = await browser.url();
    expect(url.split("?")[0]).toBe("https://about.google/");
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
