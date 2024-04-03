import { z } from "zod";

import { Browser } from "./browser";
import { Logger, generateUUID } from "./utils";
import {
  BrowserObjective,
  ObjectiveState,
} from "./types/browser/browser.types";
import { Agent } from "./agent/agent";
import { remember } from "./collectiveMemory/remember";
import { ModelResponseType } from "./types/browser/actionStep.types";
import { BrowserAction } from "./types/browser/actions.types";

import { debug } from "./utils";
import { Inventory } from "./inventory";
import { memorize } from "./collectiveMemory/memorize";

import { BrowserBehaviorConfig } from "./types/agentBrowser.types";
import { CollectiveMemoryConfig } from "./types";

export class AgentBrowser {
  agent: Agent;
  browser: Browser;
  logger: Logger;
  config: BrowserBehaviorConfig;
  inventory?: Inventory;
  plugins: any; // to be done later
  hdrConfig: CollectiveMemoryConfig;

  private objectiveProgress: string[];
  private memorySequenceId: string = generateUUID();

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
    this.hdrConfig = CollectiveMemoryConfig.parse({});

    this.objectiveProgress = [];
  }

  private setMemorySequenceId() {
    this.memorySequenceId = generateUUID();
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
    let config = {};
    if (this.inventory) {
      config = { inventory: this.inventory };
    }
    const prompt = this.agent.prompt(state, memories, config);
    const response = await this.agent.askCommand<T>(prompt, responseType);

    if (response === undefined) {
      return this.returnErrorState("Agent failed to respond");
    }
    this.memorize(state, response);
    this.objectiveProgress.push(response.description);

    return response;
  }

  private async handleStep<T extends z.ZodType<ModelResponseType>>(
    response: T,
    responseType: T
  ) {
    const stepResponse = responseType.parse(response);
    debug.write(`Step response: ${JSON.stringify(stepResponse)}`);

    if (stepResponse.objectiveComplete) {
      return {
        result: { kind: "ObjectiveComplete", result: stepResponse },
        url: this.browser.url(),
        content: this.browser.content(),
      };
    } else if (stepResponse.command) {
      debug.write("Performing action:" + JSON.stringify(stepResponse.command));
      this.browser.performManyActions(
        stepResponse.command as BrowserAction[],
        this.inventory
      );
    }
  }

  async browse<T extends z.ZodType<ModelResponseType | any>>(
    browserObjective: BrowserObjective,
    responseType: T
  ) {
    const { startUrl, objective, maxIterations } =
      BrowserObjective.parse(browserObjective);

    this.setMemorySequenceId();
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

          const response = await this.step(currentObjective, responseType);
          // const stepResponse = responseType.parse(
          //   await this.step(currentObjective, responseType)
          // ); // TODO: fix this type

          await this.handleStep(responseType.parse(response), responseType);

          iterationCount++;
        }

        iterationCount++; // Increment the current iteration counter
      } while (true);
    } catch {}
  }

  reset() {
    this.objectiveProgress = [];
  }

  async memorize(state: ObjectiveState, action: ModelResponseType) {
    if (this.config.telemetry) {
      let censoredState = state;
      // remove all PII from the state dom
      if (this.inventory) {
        censoredState = {
          ...state,
          ariaTree: this.inventory.censor(state.ariaTree),
        };
      }
      memorize(censoredState, action, this.memorySequenceId, this.hdrConfig);
    }
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
