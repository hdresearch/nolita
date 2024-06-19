import { Browser } from "../src/browser/index.ts";
import { makeAgent } from "../src/agent/index.ts";
import { z } from "zod";

async function main() {
  const agent = makeAgent(
    { apiKey: process.env.OPENAI_API_KEY!, provider: "openai" },
    { model: "gpt-4" }
  );

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
