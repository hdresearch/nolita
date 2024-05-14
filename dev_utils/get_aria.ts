import { Agent, completionApiBuilder } from "../src/agent";
import { Browser } from "../src/browser";
import yargs from "yargs/yargs";
const parser = yargs(process.argv.slice(2)).options({
  url: { type: "string" },
  headless: { type: "boolean", default: true },
});

export async function main() {
  const argv = await parser.parse();

  if (!argv.url) {
    throw new Error("url is not provided");
  }

  const providerOptions = {
    apiKey: process.env.OPENAI_API_KEY!,
    provider: "openai",
  };

  const chatApi = completionApiBuilder(providerOptions, {
    model: "gpt-4-turbo",
  });

  const agent = new Agent({ modelApi: chatApi! });

  const browser = await Browser.launch(argv.headless, agent);
  const page = await browser.newPage();
  await page.goto(argv.url);

  console.log("Inner content:", await page.content());
  console.log("ARIA TREE:", await page.parseContent());

  const tree = await page.parseContent();
  console.log("raw tree", tree);

  await browser.close();
}

main();
