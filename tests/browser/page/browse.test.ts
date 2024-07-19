import { describe, expect, it, beforeAll } from "@jest/globals";
import { z } from "@hono/zod-openapi";

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
      model: "gpt-4",
      objectMode: "TOOLS",
    });

    agent = new Agent({ modelApi: chatApi! });
  }, 5000);

  it("should browse a website", async () => {
    const logger = new Logger();
    const browser = await Browser.launch(true, agent, logger);
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
      },
    );
    expect(result).toBeDefined();
    await browser.close();
  }, 60000);
});
