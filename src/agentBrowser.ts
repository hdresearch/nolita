import { z } from "zod";

import { Browser } from "./browser";
import { Logger } from "./utils";
import {
  BrowserObjective,
  ObjectiveState,
} from "./types/browser/browser.types";
import { Agent } from "./agent/baseAgent";
import { remember } from "./memories/memory";
import { ModelResponse } from "./types/browser/actionStep.types";
import { BrowserAction } from "./types/browser/actions.types";

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
  plugins: any; // to be done later

  private objectiveProgress: string[];

  constructor(
    agent: Agent,
    browser: Browser,
    logger: Logger,
    behaviorConfig: BrowserBehaviorConfig = BrowserBehaviorConfig.parse(
      {} as any
    )
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
    const memories = await remember(state);
  }

  async step<T extends z.ZodTypeAny>(
    currentObjective: string,
    responseType: T
  ) {
    const state: ObjectiveState = await this.browser.state(
      currentObjective,
      this.objectiveProgress
    );
    const memories = await remember(state);
    const prompt = this.agent.prompt(state, memories, {});
    const response = await this.agent.askCommand(prompt, responseType);

    if (response === undefined) {
      return this.returnErrorState("Agent failed to respond");
    }

    this.objectiveProgress.push(response.description);

    return response;
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
          // check if we have exceeded maxIterations and return the failure state if so
          if (iterationCount > maxIterations) {
            console.error(
              "Maximum number of iterations exceeded. Halting browser."
            );
            return await this.returnErrorState(
              "Maximum number of iterations exceeded"
            );
          }
          const stepResponse = (await this.step(
            currentObjective,
            responseType
          )) as ModelResponse; // TODO: fix this type

          console.log("Step response:", stepResponse);

          if (stepResponse.objectiveComplete) {
            return {
              result: { kind: "ObjectiveComplete", result: stepResponse },
              url: this.browser.url(),
              content: this.browser.content(),
            };
          } else if (stepResponse.command) {
            console.log(
              "Performing action:" + JSON.stringify(stepResponse.command)
            );
            this.browser.performManyActions(
              stepResponse.command as BrowserAction[]
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
