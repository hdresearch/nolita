import { z } from "zod";
import { Browser } from "./browser";
import { Logger, generateUUID } from "./utils";
import {
  BrowserObjective,
  ObjectiveState,
} from "./types/browser/browser.types";
import { Agent } from "./agent/agent";
import {
  fetchMemorySequence,
  findRoute,
  remember,
} from "./collectiveMemory/remember";
import {
  ModelResponseSchema,
  ModelResponseType,
  ObjectiveComplete,
  ObjectiveCompleteResponse,
} from "./types/browser/actionStep.types";
import { BrowserAction } from "./types/browser/actions.types";

import { debug } from "./utils";
import { Inventory } from "./inventory";
import { memorize } from "./collectiveMemory/memorize";

import { BrowserBehaviorConfig } from "./types/agentBrowser.types";
import { CollectiveMemoryConfig } from "./types";
import { Memory } from "./types/memory.types";

export class AgentBrowser {
  agent: Agent;
  browser: Browser;
  logger: Logger;
  config: BrowserBehaviorConfig;
  inventory?: Inventory;
  plugins: any; // to be done later
  hdrConfig: CollectiveMemoryConfig;

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

  async performMemory(currentObjective: string, memory: Memory) {
    // call this so the browser's internal page state is updated
    const state = await this.browser.state(
      memory.objectiveState.objective,
      this.objectiveProgress
    );

    let description = "";
    // we should relax this condition in the future
    if (state.ariaTree === memory.objectiveState.ariaTree) {
      debug.write("Performing action step from memory");
      this.browser.performManyActions(
        memory.actionStep.command as BrowserAction[],
        this.inventory
      );
      description = memory.actionStep.description;
    } else {
      debug.write("Modifying actions");
      let modifiedActionStep = await this.agent.modifyActions(state, memory, {
        inventory: this.inventory,
      });

      if (modifiedActionStep === undefined) {
        return this.returnErrorState("Agent failed to respond");
      }

      description = modifiedActionStep.description;
      this.browser.performManyActions(
        modifiedActionStep.command as BrowserAction[],
        this.inventory
      );
    }

    // add the description to the progress so the model understands
    // what has been done so far
    // we need this to help objectiveComplete steps return correctly
    this.objectiveProgress.push(description);
  }

  async followPath<
    TObjectiveComplete extends z.AnyZodObject = typeof ObjectiveComplete
  >(
    memorySequenceId: string,
    browserObjective: BrowserObjective,
    responseSchema: ReturnType<
      typeof ObjectiveCompleteResponse<TObjectiveComplete>
    >
  ) {
    const memoriesBackwards = await fetchMemorySequence(
      memorySequenceId,
      this.hdrConfig
    );

    this.logger.log("Following memory sequence: " + memorySequenceId);

    const memories = memoriesBackwards.reverse();

    await this.browser.goTo(
      memories[0].objectiveState.url,
      this.config.goToDelay
    );

    if (memories.length === 0) {
      throw new Error("No memories found for sequence id");
    }

    while (this.iterationCount <= browserObjective.maxIterations) {
      for (const memory of memories) {
        if (memory.actionStep.objectiveComplete) {
          const state: ObjectiveState = await this.browser.state(
            memory.objectiveState.objective,
            this.objectiveProgress
          );
          const step = await this.agent.generateResponseType(
            state,
            memory,
            responseSchema
          );
          // todo: this is messy because it is not returning the correct type. Need to fix.
          const stepResponse = responseSchema.parse(step.objectiveComplete);

          const answer = {
            kind: "ObjectiveComplete",
            result: stepResponse,
            url: this.browser.url(),
            content: this.browser.content(),
          };
          if (this.logger) {
            this.logger.log(JSON.stringify(answer));
          }
          return answer;
        } else {
          await this.performMemory(browserObjective.objective[0], memory);
        }
      }
    }
  }

  async remember(state: ObjectiveState): Promise<Memory[]> {
    return await remember(state, this.hdrConfig);
  }

  async step<
    TObjectiveComplete extends z.AnyZodObject = typeof ObjectiveComplete
  >(
    currentObjective: string,
    responseType: ReturnType<typeof ModelResponseSchema<TObjectiveComplete>>
  ) {
    const state: ObjectiveState = await this.browser.state(
      currentObjective,
      this.objectiveProgress
    );
    const memories = await this.remember(state);
    // console.log("Memories", memories);
    let config = {};
    if (this.inventory) {
      config = { inventory: this.inventory };
    }
    const prompt = this.agent.prompt(state, memories, config);
    const response = await this.agent.askCommand<TObjectiveComplete>(
      prompt,
      responseType
    );

    if (response === undefined) {
      return this.returnErrorState("Agent failed to respond");
    }
    this.memorize(
      state,
      ModelResponseSchema(ObjectiveComplete).parse(response)
    );
    this.objectiveProgress.push(response.description);

    return response;
  }

  async browse<
    TObjectiveComplete extends z.AnyZodObject = typeof ObjectiveComplete
  >(
    browserObjective: BrowserObjective,
    responseType: ReturnType<typeof ModelResponseSchema<TObjectiveComplete>>
  ) {
    const { startUrl, objective, maxIterations } =
      BrowserObjective.parse(browserObjective);

    this.setMemorySequenceId();

    const sequenceId = await findRoute(
      { url: startUrl, objective: objective[0] },
      this.hdrConfig
    );

    if (sequenceId) {
      return await this.followPath(
        sequenceId,
        browserObjective,
        ObjectiveCompleteResponse<TObjectiveComplete>()
      );
    }

    // goto the start url
    await this.browser.goTo(startUrl, this.config.goToDelay);

    try {
      do {
        // loop through all objectives
        for (const currentObjective of objective) {
          // check if we have exceeded maxIterations and return the failure state if so
          if (this.iterationCount > maxIterations) {
            return await this.returnErrorState(
              "Maximum number of iterations exceeded"
            );
          }
          const step = await this.step(currentObjective, responseType);
          const stepResponse = responseType.parse(step);

          if (this.logger) {
            this.logger.log(JSON.stringify(stepResponse));
          }

          if (stepResponse.objectiveComplete) {
            const answer = {
              kind: "ObjectiveComplete",
              result: stepResponse,
              url: this.browser.url(),
              content: this.browser.content(),
            };
            if (this.logger) {
              this.logger.log(JSON.stringify(answer));
            }
            return answer;
          } else if (stepResponse.command) {
            debug.write(
              "Performing action:" + JSON.stringify(stepResponse.command)
            );
            this.browser.performManyActions(
              stepResponse.command as BrowserAction[],
              this.inventory
            );
          }

          this.iterationCount++;
        }

        this.iterationCount++; // Increment the current iteration counter
      } while (true);
    } catch {}
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

  async returnErrorState(failureReason: string) {
    const answer = {
      result: { kind: "ObjectiveFailed", result: failureReason },
      url: this.browser.url(),
      content: this.browser.content(),
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
