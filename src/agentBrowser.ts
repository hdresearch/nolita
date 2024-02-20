import { z } from "zod";

import { AgentInterface } from "./agent/interface";
import { Browser } from "./browser";
import { Logger } from "./utils";
import { BrowserObjective, ObjectiveState } from "./types/browser.types";

export const BrowserBehaviorConfig = z.object({
  goToDelay: z.number().int().default(1000),
  actionDelay: z.number().int().default(100),
});

export type BrowserBehaviorConfig = z.infer<typeof BrowserBehaviorConfig>;

export class AgentBrowser {
  agent: AgentInterface;
  browser: Browser;
  logger: Logger;
  config: BrowserBehaviorConfig;

  private objectiveProgress: string[];

  constructor(
    agent: AgentInterface,
    browser: Browser,
    logger: Logger,
    behaviorConfig: BrowserBehaviorConfig
  ) {
    this.agent = agent;
    this.browser = browser;
    this.logger = logger;

    this.config = behaviorConfig;

    this.objectiveProgress = [];
  }

  async create(
    agent: AgentInterface,
    browser: Browser,
    logger: Logger,
    behaviorConfig: BrowserBehaviorConfig
  ) {}

  async browse<T>(
    browserObjective: BrowserObjective,
    responseType: T,
    delay: number = 1000
  ) {
    const { startUrl, objective, maxIterations } =
      BrowserObjective.parse(browserObjective);

    let iterationCount = 0;
    // goto the start url
    await this.browser.goTo(startUrl, this.config.goToDelay);

    try {
      do {
        // loop through all objectives
        for (const currentObjective of objective) {
          // grab the current world state first in case we are in a failure state
          const state: ObjectiveState = await this.browser.state(
            currentObjective,
            this.objectiveProgress
          );

          // check if we have exceeded maxIterations and return the failure state if so
          if (iterationCount > maxIterations) {
            console.error(
              "Maximum number of iterations exceeded. Halting browser."
            );
            return await this.returnErrorState(
              "Maximum number of iterations exceeded"
            );
          }

          this.agent.getCommand(state, responseType);
        }

        iterationCount++; // Increment the current iteration counter
      } while (true);
    } catch {}
  }

  reset() {
    this.objectiveProgress = [];
  }

  async returnErrorState(failureReason: string) {
    return {
      result: { kind: "ObjectiveFailed", result: failureReason },
      url: this.browser.url(),
      content: this.browser.content(),
    };
  }

  async close() {
    await this.browser.close();
  }
}
