import { describe, expect, it, beforeAll } from "@jest/globals";
import { z } from "zod";

import { Browser } from "../../../src/browser";

import { Agent, completionApiBuilder } from "../../../src/agent";
import { Logger } from "../../../src/utils";

describe("Page", () => {
  let agent: Agent;

  beforeAll(async () => {
    const providerOptions = {
      apiKey: process.env.OPENAI_API_KEY!,
      provider: "openai",
    };

    const chatApi = completionApiBuilder(providerOptions, {
      objectMode: "TOOLS",
      model: "gpt-4-turbo",
    });

    agent = new Agent({ modelApi: chatApi! });
  }, 5000);

  it("should retreive information via step", async () => {
    const logger = new Logger();
    const browser = await Browser.launch(true, agent, logger);
    const page = await browser.newPage();

    await page.goto("https://hdr.is/people");

    const schema = z.object({
      emails: z
        .array(z.string())
        .describe("The email addresses found on the page"),
    });

    let result = await page.step(
      "tell me the email addresses on the page",
      schema
    );

    expect(result.objectiveComplete?.emails).toBeDefined();
    await browser.close();
  }, 30000);

  it("should take an action", async () => {
    const logger = new Logger();
    const browser = await Browser.launch(true, agent, logger);
    const page = await browser.newPage();

    await page.goto("https://hdr.is");

    let result = await page.step("click on the company link");

    expect(result.command).toBeDefined();
    await browser.close();
  }, 20000);

  it("should chain steps together", async () => {
    const logger = new Logger();
    const browser = await Browser.launch(true, agent, logger);
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
