import {
  describe,
  expect,
  test,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import { Browser } from "../../src/browser/index";
import {
  BrowserMode,
  ObjectiveState,
} from "../../src/types/browser/browser.types";

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

  test("screenshot", async () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Hello, World!</h1>
      </body>
      </html>
    `;
    const dataUrl = `data:text/html,${encodeURIComponent(htmlContent)}`;
    await browser.goTo(dataUrl);
    const screenshot = await browser.captureScreenshot();
    const expectedStringPartial = "iVBORw0KGgoAAAANSUhEUgAAAy";
    expect(screenshot.slice(0, expectedStringPartial.length)).toBe(
      expectedStringPartial
    );
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

  test("Click", async () => {
    await browser.performAction({ kind: "Click", index: 1 });
    // sleep for a bit to let the page load
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const url = await browser.url();
    expect(url.split("?")[0]).toBe("https://about.google/");
  });

  test("Click link as array", async () => {
    await browser.performManyActions([{ kind: "Click", index: 1 }]);
    // sleep for a bit to let the page load
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const url = await browser.url();
    expect(url.split("?")[0]).toBe("https://about.google/");
  });

  test("Type", async () => {
    console.log("MAP:", await browser.getMap());
    await browser.performManyActions([
      {
        kind: "Type",
        index: 8,
        text: "High Dimensional Research",
      },
    ]);
    console.log("MAP:", await browser.getMap());

    await browser.performManyActions([
      {
        kind: "Click",
        index: 11,
      },
    ]);

    const url = await browser.url();
    expect(url).toContain(
      "https://www.google.com/search?q=High+Dimensional+Research"
    );
  });

  test("Scroll up", async () => {
    await browser.goTo("https://hdr.is");
    const initialOffset = await browser.page.evaluate(() => window.pageYOffset);
    await browser.performAction({ kind: "Scroll", direction: "down" });
    const newOffset = await browser.page.evaluate(() => window.pageYOffset);
    expect(newOffset).toBeGreaterThan(initialOffset);
  });

  test("Scroll down", async () => {
    await browser.goTo("https://hdr.is");
    await browser.performAction({ kind: "Scroll", direction: "down" });
    const initialOffset = await browser.page.evaluate(() => window.pageYOffset);
    await browser.performAction({ kind: "Scroll", direction: "up" });
    const newOffset = await browser.page.evaluate(() => window.pageYOffset);
    expect(newOffset).toBeLessThan(initialOffset);
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
