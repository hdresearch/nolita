import { z } from "zod";

import { Agent } from "./agent";
import { makeAgent } from "./agent";
import { Browser } from "./browser";
import { Logger } from "./utils";
import { Inventory } from "./inventory";

/**
 * High level wrapper for the Nolita API.
 *
 * @class
 * @property {string} hdrApiKey - The HDR api key.
 * @property {string} hdrEndpoint - The collective memory endpoint. Defaults to "https://api.hdr.is".
 * @property {Agent} agent - The agent instance that interacts with the browser. Defaults to OpenAI's gpt-4
 */
export class Nolita {
  hdrApiKey: string;
  hdrEndpoint: string = "https://api.hdr.is";

  agent: Agent;

  /**
   * Initializes a new instance of the Nolita class.
   * @param hdrApiKey - The HDR api key.
   * @param providerApiKey - The collective memory endpoint. Defaults to "https://api.hdr.is".
   * @param opts - Optional configuration options
   * @param opts.provider - The provider to use. Defaults to "openai".
   * @param opts.model - The model to use. Defaults to "gpt-4".
   * @param opts.temperature - The temperature to use. Defaults to 0
   * @param opts.systemPrompt - The system prompt to use.
   * @param opts.endpoint - The collective memory endpoint. Defaults to "https://api.hdr.is".
   */
  constructor(
    hdrApiKey: string,
    providerApiKey: string,
    opts?: {
      provider?: string;
      model?: string;
      temperature?: number;
      systemPrompt?: string;
      endpoint?: string;
    }
  ) {
    this.hdrApiKey = hdrApiKey;
    this.hdrEndpoint = opts?.endpoint ?? this.hdrEndpoint;
    this.agent = makeAgent(
      {
        provider: opts?.provider ?? "openai",
        apiKey: providerApiKey ?? process.env.OPENAI_API_KEY,
      },
      { model: opts?.model ?? "gpt-4", objectMode: "TOOLS", ...opts },
      undefined,
      { systemPrompt: opts?.systemPrompt }
    );
  }

  /**
   * Executes a task using the Nolita API.
   * @param task -- string "Tell me the email addresses on the contact page"
   * @param task.startUrl -- string The URL the taks will begin at "https://hdr.is"
   * @param task.objective -- string The objective of the task "Tell me the email addresses on the contact page"
   * @param task.returnSchema -- z.ZodObject<any> The schema to return
   * @param opts
   * @param opts.maxTurns -- number The maximum number of turns to allow. Defaults to 10
   * @param opts.headless -- boolean Whether to run the browser in headless mode. Defaults to false
   * @param opts.inventory -- Inventory The inventory to use when doing tasks
   * @returns
   */
  async task(
    task: {
      startUrl: string;
      objective: string;
      returnSchema: z.ZodObject<any>;
    },
    opts?: { maxTurns?: number; headless?: boolean; inventory: Inventory }
  ) {
    const browser = await Browser.launch(
      opts?.headless ?? false,
      this.agent,
      new Logger(["info"], (msg) => console.log(msg)),
      {
        apiKey: this.hdrApiKey,
        endpoint: this.hdrEndpoint,
        ...opts,
      }
    );

    const page = await browser.newPage();

    await page.goto(task.startUrl);

    return await page.browse(task.objective, {
      schema: task.returnSchema,
      maxTurns: opts?.maxTurns ?? 10,
    });
  }
}
