import { z } from "zod";
import { Browser, Page } from "./browser";
import { Logger } from "./utils";
import { Inventory } from "./inventory";

import { BrowserBehaviorConfig } from "./types/agentBrowser.types";
import { CollectiveMemoryConfig } from "./types";
import { BrowserObjective, ModelResponseSchema } from "./types/browser";
import { ProviderConfig } from "./agent";

export class AgentBrowser {
  agent: ProviderConfig;
  browser: Browser;
  logger: Logger;
  config: BrowserBehaviorConfig;
  inventory?: Inventory;
  hdrConfig: CollectiveMemoryConfig;
  page: Page | undefined;

  private objectiveProgress: string[];

  constructor(agentBrowserArgs: {
    agent: ProviderConfig;
    browser: Browser;
    logger?: Logger;
    inventory?: Inventory;
    behaviorConfig?: BrowserBehaviorConfig;
    collectiveMemoryConfig?: CollectiveMemoryConfig;
  }) {
    this.agent = agentBrowserArgs.agent;
    this.browser = agentBrowserArgs.browser;
    this.logger = agentBrowserArgs.logger ?? new Logger(["info"]);
    this.config =
      agentBrowserArgs.behaviorConfig ??
      BrowserBehaviorConfig.parse(
        {} as any // for zod optionals
      );
    this.inventory = agentBrowserArgs.inventory;

    this.hdrConfig =
      agentBrowserArgs.collectiveMemoryConfig ??
      CollectiveMemoryConfig.parse({});

    this.objectiveProgress = [];
  }
  async followPath(
    memorySequenceId: string,
    page: Page,
    browserObjective: BrowserObjective,
    responseSchema: z.ZodObject<any>
  ) {
    return await page.followRoute(memorySequenceId, {
      inventory: this.inventory,
      maxTurns: browserObjective.maxIterations,
      schema: responseSchema,
    });
  }

  async step(
    page: Page,
    currentObjective: string,
    responseType: z.ZodObject<any>
  ) {
    return await page.step(currentObjective, responseType, {
      progress: this.objectiveProgress,
      inventory: this.inventory,
    });
  }

  async browse<T extends z.ZodObject<any>>(
    browserObjective: BrowserObjective,
    responseType?: T
  ) {
    const { startUrl, objective, maxIterations } =
      BrowserObjective.parse(browserObjective);

    const schema = ModelResponseSchema(responseType);
    const page = await this.browser.newPage();

    await page.goto(startUrl);
    for (const browseObjective of objective) {
      const res = await page.browse(browseObjective, {
        schema: responseType,
        maxTurns: maxIterations,
        inventory: this.inventory,
      });
      return schema.parse(res);
    }
  }

  reset() {
    this.objectiveProgress = [];
  }

  async close() {
    await this.browser.close();
  }
}
