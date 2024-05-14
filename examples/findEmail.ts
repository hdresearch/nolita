import { Page } from "../src/browser/page.ts";
import { Browser } from "../src/browser/index.ts";
import { completionApiBuilder } from "../src/agent/config.ts";
import { Agent } from "../src/agent/index.ts";
import { z } from "zod";

async function main() {
  const providerOptions = {
    apiKey: process.env.OPENAI_API_KEY!,
    provider: "openai",
  };

  const chatApi = completionApiBuilder(providerOptions, {
    model: "gpt-4-turbo",
  });

  if (!chatApi) {
    throw new Error(
      `Failed to create chat api for ${providerOptions.provider}`
    );
  }
  const agent = new Agent({
    modelApi: chatApi,
  });

  const browser = await Browser.launch(false, agent);

  const page = await browser.newPage();

  await page.goto("https://hdr.is");

  await page.do("click on the company link");
  const answer = await page.get(
    "Find all the email addresses on the page",
    z.object({
      emails: z
        .array(z.string())
        .describe("The email addresses found on the page"),
    })
  );

  console.log(answer);
  await browser.close();
}

main();
