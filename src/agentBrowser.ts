import { z } from "zod";

import { Browser } from "./browser";
import { Logger } from "./utils";
import {
  BrowserObjective,
  ObjectiveState,
} from "./types/browser/browser.types";
import { Agent } from "./agent/baseAgent";

export const BrowserBehaviorConfig = z.object({
  goToDelay: z.number().int().default(1000),
  actionDelay: z.number().int().default(100),
});

export type BrowserBehaviorConfig = z.infer<typeof BrowserBehaviorConfig>;

export class AgentBrowser {
  agent: Agent;
  browser: Browser;
  logger: Logger;
  config: BrowserBehaviorConfig;
  plugins: any;

  private objectiveProgress: string[];

  constructor(
    agent: Agent,
    browser: Browser,
    logger: Logger,
    behaviorConfig: BrowserBehaviorConfig,
    plugins: any
  ) {
    this.agent = agent;
    this.browser = browser;
    this.logger = logger;

    this.config = behaviorConfig;

    this.objectiveProgress = [];
  }

  async create(
    agent: Agent,
    browser: Browser,
    logger: Logger,
    behaviorConfig: BrowserBehaviorConfig
  ) {}

  // returns {action: ActionStep, state: ObjectiveState}
  async remember(state: ObjectiveState) {
    // this.objectiveProgress.push(state.objective);
  }

  async browse<T extends z.ZodTypeAny>(
    browserObjective: BrowserObjective,
    responseType: T
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
          const prompt = this.agent.prompt(state, [], {});
          this.agent.askCommand(prompt, responseType);
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
