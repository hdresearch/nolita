import { describe, it, expect, beforeAll, jest } from "@jest/globals";

import { Browser } from "../../../src/browser/index";
import { Agent, completionApiBuilder } from "../../../src/agent";

jest.retryTimes(3);

describe("Page interaction -- SCROLL", () => {
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Scroll Test</title>
    <style>
      body {
        height: 2000px;
      }
      
      #top {
        position: fixed;
        top: 20px;
        left: 20px;
      }
      
      #bottom {
        position: fixed;
        bottom: 20px;
        right: 20px;
      }
    </style>
  </head>
  <body>
    <h1>Scroll Test</h1>
    
    <div id="top">Top of the page</div>
    <div id="bottom">Bottom of the page</div>
    
    <script>
      window.scrollTo(0, 0); // Scroll to the top of the page initially
    </script>
  </body>
  </html>
        `;
  const dataUrl = `data:text/html,${encodeURIComponent(htmlContent)}`;

  let agent: Agent;

  beforeAll(async () => {
    const providerOptions = {
      apiKey: process.env.OPENAI_API_KEY!,
      provider: "openai",
    };

    const chatApi = completionApiBuilder(providerOptions, {
      objectMode: "TOOLS",
      model: "gpt-4-turbo",
    });

    agent = new Agent({ modelApi: chatApi! });
  }, 20000);

  it("should scroll to the bottom", async () => {
    const browser = await Browser.launch(true, agent);
    const page = await browser.newPage();

    await page.goto(dataUrl);

    const initialScrollY = await page.page.evaluate(() => window.scrollY);
    expect(initialScrollY).toEqual(0);

    await page.parseContent();
    await page.performAction({
      kind: "Scroll",
      direction: "down",
    });

    const finalScrollY = await page.page.evaluate(() => window.scrollY);
    expect(finalScrollY).toBeGreaterThan(0);

    await browser.close();
  }, 20000);

  it("should scroll to the top", async () => {
    const browser = await Browser.launch(true, agent);
    const page = await browser.newPage();
    await page.goto(dataUrl);

    await page.parseContent();
    await page.performAction({
      kind: "Scroll",
      direction: "up",
    });

    const finalScrollY = await page.page.evaluate(() => window.scrollY);
    expect(finalScrollY).toEqual(0);
    await browser.close();
  }, 20000);

  it("should scroll via do", async () => {
    const browser = await Browser.launch(true, agent);
    const page = await browser.newPage();

    await page.goto(dataUrl);

    await page.parseContent();
    await page.do("scroll down", { agent });

    const finalScrollY = await page.page.evaluate(() => window.scrollY);
    expect(finalScrollY).toBeGreaterThan(0);
    await browser.close();
  }, 10000);
});
