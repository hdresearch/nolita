import { describe, expect, it } from "@jest/globals";
import { z } from "zod";

import { Browser } from "../../../src/browser";

import { Logger } from "../../../src/utils";
import { DEFAULT_PROVIDER_CONFIG } from "../../fixtures";

describe("Page", () => {
  it("should retreive information via step", async () => {
    const logger = new Logger();
    const browser = await Browser.launch(true, DEFAULT_PROVIDER_CONFIG, logger);
    const page = await browser.newPage();

    await page.goto("https://hdr.is/people");

    const schema = z.object({
      emails: z
        .array(z.string())
        .describe("The email addresses found on the page"),
    });

    const result = await page.step(
      "tell me the email addresses on the page",
      schema
    );

    expect(result.objectiveComplete?.emails).toBeDefined();
    await browser.close();
  }, 30000);

  it("should take an action", async () => {
    const logger = new Logger();
    const browser = await Browser.launch(true, DEFAULT_PROVIDER_CONFIG, logger);
    const page = await browser.newPage();

    await page.goto("https://hdr.is");

    const result = await page.step("click on the company link");

    expect(result.command).toBeDefined();
    await browser.close();
  }, 20000);

  it("should chain steps together", async () => {
    const logger = new Logger();
    const browser = await Browser.launch(true, DEFAULT_PROVIDER_CONFIG, logger);
    const page = await browser.newPage();

    await page.goto("https://hdr.is");
    const schema = z.object({
      emails: z
        .array(z.string())
        .describe("The email addresses found on the page"),
    });

    let result = await page.step("click on the company link");

    expect(result.command).toBeDefined();

    result = await page.step("tell me the email addresses on the page", schema);

    expect(result.objectiveComplete?.emails).toBeDefined();
    await browser.close();
  }, 60000);
});
