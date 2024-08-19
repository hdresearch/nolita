import { describe, it, expect, jest } from "@jest/globals";

import { Browser } from "../../../src/browser/index";
import { DEFAULT_PROVIDER_CONFIG } from "../../fixtures";

jest.retryTimes(3);

describe("Page interaction -- Type", () => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body>
        <textarea>Hello, World!</textarea>
      </body>
    </html>
    `;
  const dataUrl = `data:text/html,${encodeURIComponent(htmlContent)}`;

  it("should enter text", async () => {
    const browser = await Browser.launch(true, DEFAULT_PROVIDER_CONFIG);
    const page = await browser.newPage();

    await page.goto(dataUrl);

    const initialValue = await page.page.evaluate(() =>
      document.querySelector("textarea")!.value.trim()
    );
    expect(initialValue).toEqual("Hello, World!");

    await page.parseContent();
    await page.performAction({
      kind: "Type",
      index: 1,
      text: "High Dimensional Research",
    });
    const value = await page.page.evaluate(() =>
      document.querySelector("textarea")!.value.trim()
    );

    expect(value).toEqual("High Dimensional Research");
    await browser.close();
  }, 30000);

  it("it should enter text as array", async () => {
    const browser = await Browser.launch(true, DEFAULT_PROVIDER_CONFIG);
    const page = await browser.newPage();
    await page.goto(dataUrl);

    const initialValue = await page.page.evaluate(() =>
      document.querySelector("textarea")!.value.trim()
    );
    expect(initialValue).toEqual("Hello, World!");

    await page.parseContent();
    await page.performManyActions([
      {
        kind: "Type",
        index: 1,
        text: "High Dimensional Research",
      },
    ]);
    const value = await page.page.evaluate(() =>
      document.querySelector("textarea")!.value.trim()
    );

    expect(value).toEqual("High Dimensional Research");
    await browser.close();
  }, 30000);

  it("should enter text via do", async () => {
    const browser = await Browser.launch(true, DEFAULT_PROVIDER_CONFIG);
    const page = await browser.newPage();

    await page.goto(dataUrl);

    await page.do(
      "type `High Dimensional Research` into the text box. Please make sure to capitalize the type in the command array",
      {
        agent: DEFAULT_PROVIDER_CONFIG,
      }
    );
    const value = await page.page.evaluate(() =>
      document.querySelector("textarea")!.value.trim()
    );

    expect(value).toEqual("High Dimensional Research");
    await browser.close();
  }, 20000);
});
