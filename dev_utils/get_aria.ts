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

  const browser = await Browser.create(argv.headless);
  await browser.goTo(argv.url);

  console.log("Inner content:", await browser.content());
  console.log("ARIA TREE:", await browser.parseContent());

  const tree = await browser.parseContent();
  console.log("raw tree", tree);

  await browser.close();
}

main();
