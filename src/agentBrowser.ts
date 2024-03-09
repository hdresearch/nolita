import { z } from "zod";

import { Browser } from "./browser";
import { Logger } from "./utils";
import {
  BrowserObjective,
  ObjectiveState,
} from "./types/browser/browser.types";
import { Agent } from "./agent/agent";
import { remember } from "./memories/memory";
import { ModelResponseType } from "./types/browser/actionStep.types";
import { BrowserAction } from "./types/browser/actions.types";

import { debug } from "./utils";
import { Inventory } from "./inventory";

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
  inventory?: Inventory;
  plugins: any; // to be done later

  private objectiveProgress: string[];

  constructor(
    agent: Agent,
    browser: Browser,
    logger: Logger,
    inventory?: Inventory,
    behaviorConfig: BrowserBehaviorConfig = BrowserBehaviorConfig.parse(
      {} as any // for zod optionals
    )
  ) {
    this.agent = agent;
    this.browser = browser;
    this.logger = logger;
    this.config = behaviorConfig;
    this.inventory = inventory;

    this.objectiveProgress = [];
  }

  // returns {action: ActionStep, state: ObjectiveState}
  // currently not implemented
  async remember(state: ObjectiveState) {
    const memories = await remember(state);
  }

  async step<T extends z.ZodType<ModelResponseType>>(
    currentObjective: string,
    responseType: T
  ) {
    const state: ObjectiveState = await this.browser.state(
      currentObjective,
      this.objectiveProgress
    );
    const memories = await remember(state);
    const prompt = this.agent.prompt(state, memories, {});
    const response = await this.agent.askCommand<T>(prompt, responseType);

    if (response === undefined) {
      return this.returnErrorState("Agent failed to respond");
    }

    this.objectiveProgress.push(response.description);

    return response;
  }

  async browse<T extends z.ZodType<ModelResponseType>>(
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
          // check if we have exceeded maxIterations and return the failure state if so
          if (iterationCount > maxIterations) {
            console.error(
              "Maximum number of iterations exceeded. Halting browser."
            );
            return await this.returnErrorState(
              "Maximum number of iterations exceeded"
            );
          }
          const stepResponse = responseType.parse(
            await this.step(currentObjective, responseType)
          ); // TODO: fix this type

          // TODO: make this a configurable logging option
          debug.write(`Step response: ${stepResponse}`);

          if (stepResponse.objectiveComplete) {
            return {
              result: { kind: "ObjectiveComplete", result: stepResponse },
              url: this.browser.url(),
              content: this.browser.content(),
            };
          } else if (stepResponse.command) {
            debug.write(
              "Performing action:" + JSON.stringify(stepResponse.command)
            );
            this.browser.performManyActions(
              stepResponse.command as BrowserAction[],
              this.inventory
            );
          }

          iterationCount++;
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
