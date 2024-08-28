import { describe, expect, it, beforeAll } from "@jest/globals";
import { z } from "zod";

import { Browser } from "../../../src/browser";
import { ObjectiveComplete } from "../../../src/types/browser";
import { Agent } from "../../../src/agent";
import { Logger } from "../../../src/utils";
import { DEFAULT_PROVIDER_CONFIG } from "../../fixtures";

// breaking these test out because they are very important
describe("Page -- get", () => {
  let agent: Agent;

  beforeAll(async () => {
    agent = new Agent({ providerConfig: DEFAULT_PROVIDER_CONFIG });
  }, 5000);

  it("should get a result", async () => {
    const logger = new Logger();
    const browser = await Browser.launch(true, agent, logger);
    const page = await browser.newPage();

    await page.goto("https://hdr.is/people");

    const result = await page.get(
      "Find all the email addresses on the page",
      z.object({
        email: z
          .array(z.string())
          .describe("The email addresses found on the page"),
      }),
      { agent }
    );
    expect(result).toBeDefined();
    expect(result.email).toContain("tynan.daly@hdr.is");
    await browser.close();
  }, 20000);

  it("should get a result with objective complete", async () => {
    const logger = new Logger();
    const browser = await Browser.launch(true, agent, logger);
    const page = await browser.newPage();

    await page.goto("https://hdr.is/people");

    const result = await page.get(
      "Find all the email addresses on the page",
      ObjectiveComplete.extend({
        emails: z
          .array(z.string())
          .describe("The email addresses found on the page"),
      }),
      { agent }
    );

    expect(result).toBeDefined();
    expect(result.emails).toContain("tynan.daly@hdr.is");
    await browser.close();
  }, 60000);

  it("should get a result with no schema", async () => {
    const logger = new Logger();
    const browser = await Browser.launch(true, agent, logger);
    const page = await browser.newPage();

    await page.goto("https://hdr.is/people");

    const result = await page.get(
      "Find all the email addresses on the page",
      ObjectiveComplete
    );

    expect(result).toBeDefined();
    await browser.close();
  }, 20000);
});
