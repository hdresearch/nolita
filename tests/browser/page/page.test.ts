import { describe, expect, it, beforeAll } from "@jest/globals";

import { Browser } from "../../../src/browser";
import { ObjectiveState } from "../../../src/types/browser";
import { Agent, completionApiBuilder } from "../../../src/agent";

// jest.retryTimes(1);

describe("Page", () => {
  let agent: Agent;

  beforeAll(async () => {
    const providerOptions = {
      apiKey: process.env.OPENAI_API_KEY!,
      provider: "openai",
    };

    const chatApi = completionApiBuilder(providerOptions, {
      model: "gpt-4-turbo",
      objectMode: "TOOLS",
    });

    agent = new Agent({ modelApi: chatApi! });
  }, 5000);

  it("should return the state of the page", async () => {
    const browser = await Browser.launch(true, agent);
    const page = await browser.newPage();
    await page.goto("http://example.com");
    const state = await page.state("Describe the page content", []);
    const safeParseResult = ObjectiveState.safeParse(state);
    expect(page).toBeDefined();
    expect(safeParseResult.success).toBe(true);
    await browser.close();
  });

  it("should make a prompt", async () => {
    const browser = await Browser.launch(true, agent);
    const page = await browser.newPage();

    await page.goto("http://example.com");

    const prompt = await page.makePrompt("What is the title of the page?");

    expect(prompt).toBeDefined();
    await browser.close();
  }, 10000);

  it("should take a screenshot", async () => {
    const browser = await Browser.launch(true, agent);
    const page = await browser.newPage();
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Hello, World!</h1>
      </body>
      </html>
    `;
    const dataUrl = `data:text/html,${encodeURIComponent(htmlContent)}`;
    await page.goto(dataUrl);
    const screenshot = await page.screenshot();
    const expectedStringPartial = "iVBOR";
    const screenshotB64 = screenshot.toString("base64");
    expect(screenshotB64.slice(0, expectedStringPartial.length)).toBe(
      expectedStringPartial
    );
    await browser.close();
  });

  it("should return html content", async () => {
    const browser = await Browser.launch(true, agent);
    const page = await browser.newPage();

    await page.goto("http://example.com");

    const html = await page.html();

    expect(html).toBeDefined();
    await browser.close();
  });

  it("should return markdown content", async () => {
    const browser = await Browser.launch(true, agent);
    const page = await browser.newPage();

    await page.goto("http://example.com");

    const markdown = await page.markdown();

    expect(markdown).toBeDefined();
    await browser.close();
  });

  it("should inject bounding boxes correctly", async () => {
    const browser = await Browser.launch(true, agent);
    const page = await browser.newPage();

    await page.goto("http://example.com");
    await page.injectBoundingBoxes();
    await new Promise((resolve) => setTimeout(resolve, 100));

    const markersCount = await page.page.evaluate(() => {
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

    await browser.close();
  }, 30000);
});
