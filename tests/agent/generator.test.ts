import { describe, expect, it } from "@jest/globals";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import { generateProviderObject } from "../../src/agent/providerCompletion";

describe("Generator", () => {
  it("should generate a response", async () => {
    const model = openai.chat("gpt-4o");

    const schema = z.object({
      posts: z
        .array(
          z.object({
            title: z.string().describe("The title of the post"),
            url: z.string().url().describe("The url of the post"),
            submitter: z.string().describe("The submitter of the post"),
          })
        )
        .min(5),
    });

    const pageContent = await fetch("https://news.ycombinator.com/news").then(
      (res) => res.text()
    );

    const res = await generateProviderObject(
      model,
      "You are a helpful scraper bot. Please scrape the front page of Hacker News and return the top 5 posts.",
      schema,
      [{ role: "user", content: pageContent }]
    );

    expect(schema.parse(res).posts).toBeDefined();
  }, 30000);
});
