import { describe, it, expect, jest } from "@jest/globals";
import { Browser } from "../../../src/browser";
import { DEFAULT_PROVIDER_CONFIG } from "../../fixtures";
jest.retryTimes(3);

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

  it("should click a button", async () => {
    const browser = await Browser.launch(true, DEFAULT_PROVIDER_CONFIG);
    const page = await browser.newPage();

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
    const browser = await Browser.launch(true, DEFAULT_PROVIDER_CONFIG);
    const page = await browser.newPage();

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
    const browser = await Browser.launch(true, DEFAULT_PROVIDER_CONFIG);
    const page = await browser.newPage();

    await page.goto(dataUrl);
    let resultText = await page.page.evaluate(
      () => document.getElementById("result")!.textContent
    );
    expect(resultText).toEqual("");

    await page.do("click on the button", { agent: DEFAULT_PROVIDER_CONFIG });

    // Verify the updated state of the result paragraph after the command

    resultText = await page.page.evaluate(
      () => document.getElementById("result")!.textContent
    );
    expect(resultText).toBe("Button clicked!");
    await browser.close();
  }, 20000);
});
