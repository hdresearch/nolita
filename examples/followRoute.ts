import { z } from "zod";

import { Browser } from "../src/browser";
import { makeAgent } from "../src/agent";
import { Logger } from "../src/utils";

async function makeRoute(browser: Browser, schema: z.ZodObject<any>) {
  const page = await browser.newPage();
  await page.goto("https://hdr.is");
  await page.do("click on the company link");
  const answer = await page.get(
    "Find all the email addresses on the page",
    schema
  );

  console.log(answer);
  return page.pageId;
}

async function followRoute(
  browser: Browser,
  routeId: string,
  schema: z.ZodObject<any>
) {
  const page = await browser.newPage();

  await page.followRoute(routeId, { schema });
}

async function main() {
  const agent = makeAgent(
    { provider: "openai", apiKey: process.env.OPENAI_API_KEY! },
    { model: "gpt-4" }
  );
  const logger = new Logger(["info"], (msg) => console.log(msg));
  const browser = await Browser.launch(false, agent, logger);

  const emailSchema = z.object({
    emails: z
      .array(z.string())
      .describe("The email addresses found on the page"),
  });
  const routeId = await makeRoute(browser, emailSchema);

  await followRoute(browser, routeId, emailSchema);

  await browser.close();
}

main();
