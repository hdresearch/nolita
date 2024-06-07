import { describe, expect, test } from "@jest/globals";
import { getChromePath, browserContext } from "../../src/browser/browserUtils";

describe("chromePaths", () => {
  test("chromepath works on local", () => {
    const chromePath = getChromePath();

    if (!(process.env.CI === "true")) {
      expect(chromePath).toBe(
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      );
      expect(chromePath).toBeDefined();
      expect(chromePath!.toLocaleLowerCase()).toContain("chrome");
    }

    if (process.env.CI === "true") {
      expect(chromePath).toBe(process.env.CHROME_PATH);
    }
  });
});

describe("browserContext", () => {
  test("browserContext works on local", async () => {
    const browser = await browserContext(true, "");
    expect(browser).toBeDefined();
    await browser.close();
  });
});
