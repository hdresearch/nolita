import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

import { Browser } from "../../../src/browser/index";

describe("Browser interaction -- SCROLL", () => {
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

  it("should scroll to the bottom", async () => {
    const browser = await Browser.create(true, "");
    await browser.goTo(dataUrl);

    const initialScrollY = await browser.page.evaluate(() => window.scrollY);
    expect(initialScrollY).toEqual(0);

    await browser.parseContent();
    await browser.performAction({
      kind: "Scroll",
      direction: "down",
    });

    const finalScrollY = await browser.page.evaluate(() => window.scrollY);
    expect(finalScrollY).toBeGreaterThan(0);

    await browser.close();
  }, 20000);

  it("should scroll to the top", async () => {
    const browser = await Browser.create(true, "");
    await browser.goTo(dataUrl);

    await browser.parseContent();
    await browser.performAction({
      kind: "Scroll",
      direction: "up",
    });

    const finalScrollY = await browser.page.evaluate(() => window.scrollY);
    expect(finalScrollY).toEqual(0);
    await browser.close();
  }, 20000);
});
