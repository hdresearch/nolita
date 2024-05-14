import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { Page } from "../../../src/browser/page";
import { Browser } from "../../../src/browser";
import { Agent, completionApiBuilder } from "../../../src/agent";

describe("Page interaction -- TYPE", () => {
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Click Test</title>
  </head>
  <body>
    <h1>Click Test</h1>
    
    <button id="myButton">Click Me</button>
    
    <p id="result"></p>
    
    <script>
      const button = document.getElementById('myButton');
      const result = document.getElementById('result');
      
      button.addEventListener('click', function() {
        result.textContent = 'Button clicked!';
      });
    </script>
  </body>
  </html>
    `;
  const dataUrl = `data:text/html,${encodeURIComponent(htmlContent)}`;

  let agent: Agent;
  let page: Page;
  let browser: Browser;

  beforeEach(async () => {
    const providerOptions = {
      apiKey: process.env.OPENAI_API_KEY!,
      provider: "openai",
    };

    const chatApi = completionApiBuilder(providerOptions, {
      model: "gpt-4-turbo",
    });

    agent = new Agent({ modelApi: chatApi! });
    browser = await Browser.create(true, agent);
    page = await browser.newPage();
  }, 20000);

  it("should click a button", async () => {
    await page.goto(dataUrl);

    let resultText = await page.page.evaluate(
      () => document.getElementById("result")!.textContent
    );
    expect(resultText).toEqual("");

    await page.parseContent();
    await page.performAction({
      kind: "Click",
      index: 2,
    });

    // Verify the updated state of the result paragraph after the click
    resultText = await page.page.evaluate(
      () => document.getElementById("result")!.textContent
    );
    expect(resultText).toBe("Button clicked!");
    await browser.close();
  }, 20000);

  it("should click a button as an array", async () => {
    await page.goto(dataUrl);

    let resultText = await page.page.evaluate(
      () => document.getElementById("result")!.textContent
    );
    expect(resultText).toEqual("");

    await page.parseContent();
    await page.performManyActions([
      {
        kind: "Click",
        index: 2,
      },
    ]);

    // Verify the updated state of the result paragraph after the click
    resultText = await page.page.evaluate(
      () => document.getElementById("result")!.textContent
    );
    expect(resultText).toBe("Button clicked!");
    await browser.close();
  }, 20000);

  it("should click a button via do", async () => {
    await page.goto(dataUrl);
    let resultText = await page.page.evaluate(
      () => document.getElementById("result")!.textContent
    );
    expect(resultText).toEqual("");

    await page.do("click on the button", { agent });

    // Verify the updated state of the result paragraph after the command

    resultText = await page.page.evaluate(
      () => document.getElementById("result")!.textContent
    );
    expect(resultText).toBe("Button clicked!");
    await browser.close();
  });
});
