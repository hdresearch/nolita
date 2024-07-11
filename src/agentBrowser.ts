import { z } from "zod";
import { Browser, Page } from "./browser";
import { Logger, generateUUID } from "./utils";

import { Agent } from "./agent/agent";
import { remember } from "./collectiveMemory/remember";

import { debug } from "./utils";
import { Inventory } from "./inventory";
import { memorize } from "./collectiveMemory/memorize";

import { BrowserBehaviorConfig } from "./types/agentBrowser.types";
import { CollectiveMemoryConfig } from "./types";
import { Memory } from "./types/memory.types";
import {
  ModelResponseSchema,
  ModelResponseType,
  ObjectiveComplete,
  ObjectiveCompleteResponse,
} from "./types/browser/actionStep.types";
import { BrowserObjective, ObjectiveState } from "./types/browser";

export class AgentBrowser {
  agent: Agent;
  browser: Browser;
  logger: Logger;
  config: BrowserBehaviorConfig;
  inventory?: Inventory;
  hdrConfig: CollectiveMemoryConfig;
  page: Page | undefined;

  private iterationCount: number = 0;

  private objectiveProgress: string[];
  private memorySequenceId: string = generateUUID();

  constructor(agentBrowserArgs: {
    agent: Agent;
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

  private setMemorySequenceId() {
    this.memorySequenceId = generateUUID();
  }

  async performMemory(page: Page, memory: Memory) {
    await page.performMemory(memory, { inventory: this.inventory });
  }

  async followPath<
    TObjectiveComplete extends z.AnyZodObject = typeof ObjectiveComplete
  >(
    memorySequenceId: string,
    page: Page,
    browserObjective: BrowserObjective,
    responseSchema: ReturnType<
      typeof ObjectiveCompleteResponse<TObjectiveComplete>
    >
  ) {
    return await page.followRoute(memorySequenceId, { schema: responseSchema });
  }

  async followRoute(page: Page, memories: Memory[]) {
    try {
      for (const memory of memories) {
        if ("objectiveComplete" in memory.actionStep) {
          return;
        } else {
          if (this.logger) {
            this.logger.log(JSON.stringify(memory.actionStep));
          }
          await this.performMemory(page, memory);
        }
      }
    } catch (e) {
      debug.write("Error following route: " + e);
    }
  }

  async remember(state: ObjectiveState): Promise<Memory[]> {
    return await remember(state, this.memorySequenceId, this.hdrConfig);
  }

  async step<
    TObjectiveComplete extends z.AnyZodObject = typeof ObjectiveComplete
  >(
    page: Page,
    currentObjective: string,
    responseType: ReturnType<typeof ModelResponseSchema<TObjectiveComplete>>
  ) {
    const state: ObjectiveState = await page.state(
      currentObjective,
      this.objectiveProgress
    );
    const memories = await this.remember(state);
    let config = {};
    if (this.inventory) {
      config = { inventory: this.inventory };
    }
    const prompt = this.agent.prompt(state, memories, config);
    const response = await this.agent.askCommand(prompt, responseType);

    if (response === undefined) {
      return this.returnErrorState(page, "Agent failed to respond");
    }
    this.memorize(
      state,
      ModelResponseSchema(ObjectiveComplete).parse(response)
    );
    this.objectiveProgress.push(response.description);

    return response;
  }

  async browse<T extends z.ZodSchema<any>>(
    browserObjective: BrowserObjective,
    responseType: T
  ): Promise<z.infer<T>> {
    const { startUrl, objective, maxIterations } =
      BrowserObjective.parse(browserObjective);

    await this.page?.goto(startUrl);
    return await this.page?.browse(objective[0], {
      schema: responseType,
      maxTurns: maxIterations,
    });
  }

  reset() {
    this.objectiveProgress = [];
    this.iterationCount = 0;
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

  async returnErrorState(page: Page, failureReason: string) {
    const answer = {
      result: { kind: "ObjectiveFailed", result: failureReason },
      url: page.url(),
      content: page.content(),
    };
    if (this.logger) {
      this.logger.log(JSON.stringify(answer));
    }
    return answer;
  }

  async close() {
    await this.browser.close();
  }
}
