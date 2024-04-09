import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

import { Browser } from "../../../src/browser/index";

describe("Browser interaction -- CLICK", () => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body>
        <textarea>Hello, World!</textarea>
      </body>
    </html>
    `;
  const dataUrl = `data:text/html,${encodeURIComponent(htmlContent)}`;

  let browser: Browser;
  beforeAll(async () => {
    browser = await Browser.create(true, "");
  }, 10000);

  it("should enter text", async () => {
    await browser.goTo(dataUrl);

    const initialValue = await browser.page.evaluate(() =>
      document.querySelector("textarea")!.value.trim()
    );
    expect(initialValue).toEqual("Hello, World!");

    await browser.parseContent();
    await browser.performAction({
      kind: "Type",
      index: 1,
      text: "High Dimensional Research",
    });
    const value = await browser.page.evaluate(() =>
      document.querySelector("textarea")!.value.trim()
    );

    expect(value).toEqual("High Dimensional Research");
  }, 10000);

  it("it should enter text as array", async () => {
    await browser.goTo(dataUrl);

    const initialValue = await browser.page.evaluate(() =>
      document.querySelector("textarea")!.value.trim()
    );
    expect(initialValue).toEqual("Hello, World!");

    await browser.parseContent();
    await browser.performManyActions([
      {
        kind: "Type",
        index: 1,
        text: "High Dimensional Research",
      },
    ]);
    const value = await browser.page.evaluate(() =>
      document.querySelector("textarea")!.value.trim()
    );

    expect(value).toEqual("High Dimensional Research");
  }, 10000);

  afterAll(async () => {
    await browser.close();
  });
});
