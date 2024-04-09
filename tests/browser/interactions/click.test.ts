import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

import { Browser } from "../../../src/browser/index";

describe("Browser interaction -- TYPE", () => {
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
    const browser = await Browser.create(true, "");

    await browser.goTo(dataUrl);

    let resultText = await browser.page.evaluate(
      () => document.getElementById("result")!.textContent
    );
    expect(resultText).toEqual("");

    await browser.parseContent();
    await browser.performAction({
      kind: "Click",
      index: 2,
    });

    // Verify the updated state of the result paragraph after the click
    resultText = await browser.page.evaluate(
      () => document.getElementById("result")!.textContent
    );
    expect(resultText).toBe("Button clicked!");
    await browser.close();
  }, 20000);

  it("should click a button as an array", async () => {
    const browser = await Browser.create(true, "");

    await browser.goTo(dataUrl);

    let resultText = await browser.page.evaluate(
      () => document.getElementById("result")!.textContent
    );
    expect(resultText).toEqual("");

    await browser.parseContent();
    await browser.performManyActions([
      {
        kind: "Click",
        index: 2,
      },
    ]);

    // Verify the updated state of the result paragraph after the click
    resultText = await browser.page.evaluate(
      () => document.getElementById("result")!.textContent
    );
    expect(resultText).toBe("Button clicked!");
    await browser.close();
  }, 20000);
});
