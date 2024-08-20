import { describe, expect, it } from "@jest/globals";
import { z } from "zod";

import { Browser } from "../../../src/browser";

import { Logger } from "../../../src/utils";
import { DEFAULT_PROVIDER_CONFIG } from "../../fixtures";

describe("Page", () => {
  it("should browse a website", async () => {
    const logger = new Logger();
    const browser = await Browser.launch(true, DEFAULT_PROVIDER_CONFIG, logger);
    const page = await browser.newPage();

    await page.goto("https://hdr.is");

    const result = await page.browse(
      "click on the company link and then return objective complete",
      {
        schema: z.object({
          emails: z
            .array(z.string())
            .describe("The email addresses found on the page"),
        }),
        maxTurns: 5,
      }
    );
    expect(result).toBeDefined();
    await browser.close();
  }, 60000);
});
