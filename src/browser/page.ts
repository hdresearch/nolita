import {
  Page as PuppeteerPage,
  ElementHandle,
  SerializedAXNode,
  CDPSession,
  Protocol,
} from "puppeteer";

// Do not touch this
// @ts-expect-error We are using undocumented puppeteer APIs
import { MAIN_WORLD } from "puppeteer";

import { z } from "zod";
import Turndown from "turndown";

import {
  AccessibilityTree,
  ObjectiveState,
  StateType,
  ObjectiveComplete,
  extendModelResponse,
} from "../types/browser";
import { Logger, debug, generateUUID } from "../utils";
import {
  BrowserAction,
  BrowserActionArray,
} from "../types/browser/actions.types";
import { Inventory } from "../inventory";
import { Agent } from "../agent";

import { memorize } from "../collectiveMemory";
import { fetchMemorySequence, remember } from "../collectiveMemory/remember";
import { ModelResponseType } from "../types";
import { DEFAULT_STATE_ACTION_PAIRS } from "../collectiveMemory/examples";
import { Memory } from "../types/memory.types";

/**
 * Represents a web page and provides methods to interact with it.
 */
export class Page {
  page: PuppeteerPage;
  private idMapping: Map<number, any> = new Map();
  private _state: ObjectiveState | undefined = undefined;
  private inventory: Inventory | undefined;
  private apiKey: string | undefined;
  private endpoint: string | undefined;
  private disableMemory: boolean = false;

  pageId: string;
  agent: Agent;
  logger?: Logger;
  progress: string[] = [];

  error: string | undefined;

  /**
   * Creates a new Page instance.
   * @param {PuppeteerPage} page - The PuppeteerPage object representing the browser page.
   * @param {Agent} agent - The Agent object representing the user agent interacting with the page.
   * @param {Object} [opts] - Optional parameters for additional configuration.
   * @param {string} [opts.pageId] - An optional unique identifier for the page; if not provided, a UUID will be generated.
   * @param {Logger} [opts.logger] - An optional logger for logging events; if not provided, logging may be absent.
   * @param {Inventory} [opts.inventory] - An optional inventory object for storing and retrieving user data.
   * @param {string} [opts.apiKey] - An optional API key for accessing collective memory.
   * @param {string} [opts.endpoint] - An optional endpoint for collective memory.
   */
  constructor(
    page: PuppeteerPage,
    agent: Agent,
    opts?: {
      pageId?: string;
      logger?: Logger;
      inventory?: Inventory;
      apiKey?: string;
      endpoint?: string;
      disableMemory?: boolean;
    }
  ) {
    this.page = page;
    this.agent = agent;
    this.pageId = opts?.pageId ?? generateUUID();
    this.logger = opts?.logger;
    this.inventory = opts?.inventory;
    this.apiKey = opts?.apiKey;
    this.endpoint = opts?.endpoint ?? "https://api.hdr.is";
    this.disableMemory = opts?.disableMemory ?? false;
  }

  /**
   * Returns the URL of the page.
   * @returns {string} The URL of the page.
   */
  url(): string {
    return this.page.url();
  }

  /**
   * Returns the text content of the page.
   * @returns {Promise<string>} A promise that resolves to the text content of the page.
   */
  async content(): Promise<string> {
    return await this.page.evaluate(() => document.body.innerText);
  }

  /**
   * Sets the viewport size of the page.
   * @param {number} width The width of the viewport.
   * @param {number} height The height of the viewport.
   * @param {number} deviceScaleFactor The device scale factor (default: 1).
   */
  async setViewport(
    width: number,
    height: number,
    deviceScaleFactor: number = 1
  ) {
    this.page.setViewport({ width, height, deviceScaleFactor });
  }

  /**
   * Takes a screenshot of the page.
   * @returns A promise that resolves to the screenshot buffer
   */
  async screenshot(): Promise<Buffer> {
    return await this.page.screenshot();
  }

  /**
   * Returns the HTML content of the page.
   * @returns A promise that resolves to the HTML content of the page.
   */
  async html(): Promise<string> {
    return await this.page.content();
  }

  /**
   * Returns the Markdown representation of the page's HTML content.
   * @returns A promise that resolves to the Markdown content of the page.   */
  async markdown(): Promise<string> {
    return new Turndown().turndown(await this.html());
  }

  /**
   * Returns the accessibility tree of the page.
   * @returns A promise that resolves to the serialized accessibility tree.
   */
  private async getAccessibilityTree(): Promise<SerializedAXNode | null> {
    return await this.page.accessibility.snapshot({ interestingOnly: true });
  }

  /**
   * Closes the page.
   */
  async close() {
    await this.page.close();
  }

  /**
   * Returns the title of the page.
   * @returns {string} The title of the page.
   */
  async title() {
    return await this.page.title();
  }

  /**
   * Logs a message to the logger.
   * @param {string} msg The message to log.
   * @private
   */
  private log(msg: string) {
    if (this.logger) {
      this.logger.log(
        JSON.stringify({
          pageId: this.pageId,
          timestamp: Date.now(),
          message: msg,
        })
      );
    }
  }

  /**
   * Navigates to a URL.
   * @param {string} url The URL to navigate to.
   * @param {Object} [opts] The navigation options.
   * @param {number} [opts.delay] The delay in milliseconds after navigating to the URL.
   */
  async goto(url: string, opts?: { delay: number }) {
    this.log(`Navigating to ${url}`);
    await this.page.goto(url);
    if (opts?.delay) {
      await new Promise((resolve) => setTimeout(resolve, opts.delay));
    }

    if (!this.disableMemory) {
      const state = await this.state("Navigate");
      const action: ModelResponseType = {
        command: [{ kind: "GoTo", url }],
        description: "Navigated to " + url,
        progressAssessment: "",
      };
      await memorize(state, action, this.pageId);
    }
  }

  /**
   * Queries the accessibility tree of an element.
   * @param {CDPSession} client The CDP session client.
   * @param {ElementHandle<Node>} element The element to query.
   * @param {string} accessibleName The accessible name of the element.
   * @param {string} role The role of the element.
   * @returns A promise that resolves to the accessibility tree of the element.
   * @private
   */
  private async queryAXTree(
    client: CDPSession,
    element: ElementHandle<Node>,
    accessibleName?: string,
    role?: string
  ): Promise<Protocol.Accessibility.AXNode[]> {
    const { nodes } = await client.send("Accessibility.queryAXTree", {
      objectId: element.remoteObject().objectId,
      accessibleName,
      role,
    });
    const filteredNodes: Protocol.Accessibility.AXNode[] = nodes.filter(
      (node: Protocol.Accessibility.AXNode) => {
        return !node.role || node.role.value !== "StaticText"; /// hmmm maybe we should remove?
      }
    );
    return filteredNodes;
  }

  /**
   * Finds an element by its index in the ID mapping.
   * @param {number} index The index of the element in the ID mapping.
   * @returns A promise that resolves to the found element handle.
   */
  private async findElement(index: number): Promise<ElementHandle<Element>> {
    const e = this.idMapping.get(index);
    const role = e[1];
    const name = e[2];

    const client = (this.page as any)._client();
    const body = await this.page.$("body");
    const res = await this.queryAXTree(client, body!, name, role);
    if (!res[0] || !res[0].backendDOMNodeId) {
      throw new Error(
        `Could not find element with role ${res[0].role} and name ${res[0].name}`
      );
    }
    const backendNodeId = res[0].backendDOMNodeId;

    const ret = (await this.page
      .mainFrame()
      // @ts-expect-error this is black magic referring to the execution context
      .worlds[MAIN_WORLD].adoptBackendNode(
        backendNodeId
      )) as ElementHandle<Element>;

    if (!ret) {
      throw new Error(
        `Could not find element by backendNodeId with role ${role} and name ${name}`
      );
    }
    return ret;
  }

  /**
   * Simplifies the accessibility tree by converting it to an AccessibilityTree structure.
   * @param {SerializedAXNode} node The serialized accessibility node to simplify.
   * @returns The simplified accessibility tree.
   */
  private simplifyTree(node: SerializedAXNode): AccessibilityTree {
    switch (node.role) {
      case "StaticText":
      case "generic":
        return node.name!;
      case "img":
        return ["img", node.name!];
      default:
        break;
    }
    const index = this.idMapping.size;
    const e: AccessibilityTree = [index, node.role, node.name!];

    this.idMapping.set(index, e);
    let children = [] as AccessibilityTree[];
    if (node.children) {
      children = node.children.map((child) => this.simplifyTree(child));
    } else if (node.value) {
      children = [node.value];
    }
    if (children.length) {
      e.push(children);
    }
    return e;
  }

  /**
   * Parses the content of the page and returns a simplified accessibility tree.
   * @returns A promise that resolves to the simplified accessibility tree as a JSON string.
   */
  async parseContent(): Promise<string> {
    const tree = await this.getAccessibilityTree();
    debug.write(`Aria tree: ${JSON.stringify(tree)}`);

    this.idMapping = new Map<number, any>();
    const tree_ret = this.simplifyTree(tree!);
    const ret = JSON.stringify(tree_ret);
    return ret;
  }

  /**
   * Retrieves the current state of the page based on the objective and progress.
   * @param {string} objective The objective of the page.
   * @param {string[]} objectiveProgress The progress of the objective.
   * @returns A promise that resolves to the objective state of the page.
   */
  async state(
    objective: string,
    objectiveProgress?: string[]
  ): Promise<ObjectiveState> {
    const contentJSON = await this.parseContent();
    const content = ObjectiveState.parse({
      kind: "ObjectiveState",
      url: this.url().replace(/[?].*/g, ""),
      ariaTree: contentJSON,
      progress: objectiveProgress ?? this.progress,
      objective: objective,
    });

    this._state = content;
    return content;
  }

  /**
   * Returns the current state of the page.
   * @returns The objective state of the page.
   */
  getState(): ObjectiveState | undefined {
    return this._state;
  }

  /**
   * Performs a browser action on the page.
   * @param {z.ZodSchema} command The browser action to perform.
   * @param {Object} opts Additional options.
   * @param {number} opts.delay The delay in milliseconds after performing the action (default: 100).
   * @param {Inventory} opts.inventory The inventory object (optional).
   */
  async performAction(
    command: BrowserAction,
    opts?: { delay?: number; inventory?: Inventory }
  ) {
    const inventory = opts?.inventory ?? this.inventory;
    const delay = opts?.delay ?? 100;
    this.error = undefined;
    try {
      switch (command.kind) {
        case "GoTo":
          await this.goto(command.url, { delay });
          break;
        case "Click": {
          const eClick = await this.findElement(command.index);
          await eClick.click();
          await new Promise((resolve) => setTimeout(resolve, delay));
          break;
        }
        case "Type": {
          let text = command.text;
          // repalce masked inventory values with real values
          if (inventory) {
            text = inventory.replaceMask(text);
          }
          const eType = await this.findElement(command.index);
          await eType.click({ clickCount: 3 }); // click to select all text
          await eType.type(text + "\n");
          await new Promise((resolve) => setTimeout(resolve, delay));
          break;
        }
        case "Wait":
          await new Promise((resolve) => setTimeout(resolve, 1000));
          break;
        case "Back":
          await this.page.goBack();
          await new Promise((resolve) => setTimeout(resolve, delay));
          break;
        case "Hover": {
          const eHover = await this.findElement(command.index);
          await eHover.hover();
          break;
        }
        case "Scroll":
          if ("direction" in command) {
            await this.page.evaluate((direction: "up" | "down") => {
              window.scrollBy(0, direction === "up" ? -100 : 100);
            }, command.direction);
          }
          break;
        default:
          throw new Error("Unknown command:" + JSON.stringify(command));
      }
    } catch (e) {
      this.error = (e as Error).toString();
      debug.error(
        ` Error ${this.error} on command: ${JSON.stringify(command)}`
      );
    }
  }

  /**
   * Performs multiple browser actions on the page.
   * @param commands An array of browser actions to perform.
   * @param {Object} opts Additional options.
   * @param {number} opts.delay The delay in milliseconds after performing the action (default: 100).
   * @param {Inventory} opts.inventory The inventory object (optional).
   */
  async performManyActions(
    commands: BrowserAction[],
    opts?: { delay?: number; inventory?: Inventory }
  ) {
    for (const command of commands) {
      await this.performAction(command, opts);
    }
  }

  /**
   * Creates a prompt for the agent based on the request and current state.
   * @param request The request or objective.
   * @param {Object} [opts] The navigation options.
   * @param {Agent} opts.agent The agent to create the prompt for.
   * @param {string[]} opts.progress The progress of the objective (optional).
   * @returns {Promise<string>} A promise that resolves to the created prompt.
   */
  async makePrompt(
    request: string,
    opts?: { progress?: string[]; agent?: Agent; inventory?: Inventory }
  ) {
    const state = (await this.state(
      request,
      opts?.progress ?? this.progress
    )) as ObjectiveState;
    const agent = opts?.agent ?? this.agent;
    const memories = this.disableMemory
      ? DEFAULT_STATE_ACTION_PAIRS
      : await remember(state, this.pageId, {
          apiKey: this.apiKey,
          endpoint: this.endpoint,
        });

    const prompt = agent.prompt(state, memories, {
      inventory: opts?.inventory,
    });

    return { prompt, state };
  }

  /**
   * Generates a command based on the request and current state.
   * @param request The request or objective.
   * @param {Object} opts Additional options.
   * @param {string[]} opts.progress The progress towards the objective (optional).
   * @param {Agent} opts.agent The agent to use (optional).
   * @param {z.ZodSchema} opts.schema The Zod schema for the return type.
   * @param {Inventory} opts.inventory The inventory object (optional).
   */
  async generateCommand<T extends z.ZodSchema<any>>(
    request: string,
    opts: {
      progress?: string[];
      agent?: Agent;
      schema: T;
      inventory?: Inventory;
    }
  ): Promise<z.infer<T>> {
    const agent = opts?.agent ?? this.agent;
    const { prompt, state } = await this.makePrompt(request, opts);

    const command = await agent.actionCall(prompt, opts.schema);

    if (!command) {
      throw new Error("No command generated");
    }

    if (!this.disableMemory) {
      await memorize(state, command as ModelResponseType, this.pageId, {
        endpoint: process.env.HDR_API_ENDPOINT ?? "https://api.hdr.is",
        apiKey: process.env.HDR_API_KEY ?? "",
      });
    }
    return command;
  }

  /**
   * Performs a request on the page.
   * @param request The request or objective.
   * @param {Object} opts Additional options.
   * @param {Agent} opts.agent The agent to use (optional).
   * @param {Inventory} opts.inventory The inventory object (optional).
   * @param {string[]} opts.progress The progress towards the objective (optional).
   * @param {number} opts.delay The delay in milliseconds after performing the action (default: 100).
   * @param {z.ZodSchema} opts.schema The Zod schema for the return type.
   */
  async do(
    request: string,
    opts?: {
      agent?: Agent;
      inventory?: Inventory;
      progress?: string[];
      delay?: number;
      schema?: z.ZodSchema<any>;
    }
  ) {
    const schema = z.object({
      command: opts?.schema ?? z.array(BrowserAction).min(1),
      progressAssessment: z.string(),
      description: z.string(),
    });
    const command = await this.generateCommand(request, { ...opts, schema });
    if (!this.disableMemory) {
      await memorize(this._state!, command as ModelResponseType, this.pageId, {
        endpoint: process.env.HDR_API_ENDPOINT ?? "https://api.hdr.is",
        apiKey: process.env.HDR_API_KEY ?? "",
      });
    }
    await this.performManyActions(command.command, opts);
  }

  /**
   * Retrieves data from the page based on the request and return type.
   * @template T The type of the return value.
   * @param request The request or objective.
   * @param outputSchema The Zod schema for the return type.
   * @param opts Additional options.
   * @param {Agent} opts.agent The agent to use (optional).
   * @param {string[]} opts.progress The progress towards the objective (optional).
   * @returns A promise that resolves to the retrieved data.
   */
  async get<T extends z.ZodSchema<any>>(
    request: string,
    outputSchema: z.ZodSchema<any> = ObjectiveComplete,
    opts?: { agent?: Agent; progress?: string[]; mode?: StateType }
  ): Promise<z.infer<T>> {
    const agent = opts?.agent ?? this.agent;
    const { prompt } = await this.makePrompt(request, opts);

    const result = await agent.returnCall(prompt, outputSchema);

    this.log(JSON.stringify(result));

    if (!this.disableMemory) {
      const action: ModelResponseType = {
        command: [{ kind: "Get", type: "aria", request }],
        description: "Getting data from the page",
        progressAssessment: "",
      };
      await memorize(this._state!, action as ModelResponseType, this.pageId, {
        endpoint: process.env.HDR_API_ENDPOINT ?? "https://api.hdr.is",
        apiKey: process.env.HDR_API_KEY ?? "",
      });
    }
    return result;
  }

  /**
   * Take the next step towards the objective.
   * @param {string} request The request or objective.
   * @param {Object} opts Additional options.
   * @param {z.ZodSchema} opts.outputSchema The Zod schema for the return type.
   * @param {Agent} opts.agent The agent to use (optional).
   * @param {string[]} opts.progress The progress towards the objective (optional).
   * @param {Inventory} opts.inventory The inventory object (optional).
   * @returns {z.ZodSchema | undefined} A promise that resolves to the retrieved data.
   */
  async step(
    objective: string,
    outputSchema?: z.ZodObject<any>,
    opts?: {
      agent?: Agent;
      progress?: string[];
      inventory?: Inventory;
      delay?: number;
    }
  ) {
    const schema = extendModelResponse(outputSchema);
    const step = await this.generateCommand(objective, {
      ...opts,
      schema: schema,
    });

    this.log(JSON.stringify(step));

    if (step.command) {
      await this.performManyActions(step.command, {
        inventory: opts?.inventory,
      });
    }

    return step;
  }

  async returnErrorState(failureReason: string) {
    const failure = {
      objectiveFailed: {
        kind: "ObjectiveFailed",
        result: failureReason,
        url: this.url(),
      },
    };

    this.log(JSON.stringify(failure));

    return failure;
  }

  /**
   * Browses the page based on the request and return type.
   * @param {string} request The request or objective.
   * @param {Object} opts Additional options.
   * @param {z.ZodSchema} opts.schema The Zod schema for the return type.
   * @param {Agent} opts.agent The agent to use (optional).
   * @param {string[]} opts.progress The progress towards the objective (optional).
   * @param {Inventory} opts.inventory The inventory object (optional).
   * @param {number} opts.maxTurns The maximum number of turns to browse.
   * @returns {z.ZodSchema} A promise that resolves to the retrieved data.
   */
  async browse(
    objective: string,
    opts: {
      schema?: z.ZodObject<any>;
      agent?: Agent;
      progress?: string[];
      inventory?: Inventory;
      maxTurns: number;
    } = {
      maxTurns: 20,
    }
  ) {
    let currentTurn = 0;
    while (currentTurn < opts.maxTurns) {
      const step = await this.step(objective, opts?.schema, {
        ...opts,
        inventory: opts.inventory ?? this.inventory,
      });

      if (step?.objectiveComplete) {
        return step;
      }

      currentTurn++;
    }

    return this.returnErrorState("Maximum number of turns exceeded");
  }

  /**
   * Performs a memory on a page
   * @param memory  The memory to perform
   * @param opts Additional options
   * @param opts.delay The delay in milliseconds after performing the action (default: 100).
   * @param opts.inventory The inventory object (optional).
   * @param opts.schema The Zod schema for the return type (optional).
   * @oaram opts.agent The agent to use (optional). Defaults to page agent.
   * @oaram opts.memoryDelay The delay in milliseconds after performing the memory (optional).
   * @returns
   */
  async performMemory(
    memory: Memory,
    opts?: {
      delay?: number;
      inventory?: Inventory;
      schema?: z.ZodObject<any>;
      agent?: Agent;
      memoryDelay?: number;
    }
  ) {
    const { actionStep, objectiveState } = Memory.parse(memory);

    if (actionStep.command) {
      const commands = BrowserActionArray.parse(actionStep.command);
      for (const command of commands) {
        if (command.kind === "Get") {
          return await this.get(command.request, opts?.schema, opts);
        }
        await this.performAction(command, opts);
      }
    } else if (actionStep.objectiveComplete) {
      return await this.get(objectiveState.objective, opts?.schema, opts);
    }
  }

  /**
   * Follows a route based on a memory sequence.
   * @param {string} memoryId The memory sequence ID.
   * @param {z.ZodSchema} outputSchema The Zod schema for the return type.
   * @param {Object} opts Additional options.
   * @param {number} opts.delay The delay in milliseconds after performing the action (default: 100).
   * @param {number} opts.maxTurns The maximum number of turns to follow the route. Currently not used.
   * @param {Inventory} opts.inventory The inventory object (optional).
   * @returns {z.ZodSchema} A promise that resolves to the retrieved data.
   * @throws {Error} An error is thrown if no memories are found for the memory sequence ID.
   */
  async followRoute(
    memoryId: string,

    opts?: {
      delay?: number;
      maxTurns?: number;
      inventory?: Inventory;
      schema?: z.ZodObject<any>;
    }
  ) {
    const memories = await fetchMemorySequence(memoryId, {
      apiKey: this.apiKey,
      endpoint: this.endpoint,
    });

    if (memories.length === 0) {
      throw new Error(`No memories found for memory sequence id ${memoryId}`);
    }

    for (const memory of memories) {
      const result = await this.performMemory(memory, opts);
      if (result) {
        return result;
      }
    }

    this.log(`Route finished for memory sequence id: ${memoryId}`);
  }

  /**
   * Injects bounding boxes around clickable elements on the page.
   */
  async injectBoundingBoxes() {
    await this.page.evaluate(() => {
      // @ts-expect-error We are writing js
      let labels = [];

      const unmarkPage = () => {
        // @ts-expect-error We are writing js
        for (const label of labels) {
          document.body.removeChild(label);
        }
        labels = [];
      };

      // Function to generate random colors
      // @ts-expect-error We are writing js
      function getColor(elementType) {
        const colorMapping = {
          INPUT: "#FF0000", // Red for input fields
          TEXTAREA: "#00FF00", // Green for textareas
          SELECT: "#0000FF", // Blue for select dropdowns
          BUTTON: "#FFFF00", // Yellow for buttons
          A: "#FF00FF", // Magenta for links
          DEFAULT: "#CCCCCC", // Grey for any other elements
        };
        // @ts-expect-error We are writing js
        return colorMapping[elementType] || colorMapping.DEFAULT;
      }

      const markPage = () => {
        unmarkPage();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const bodyRect = document.body.getBoundingClientRect();

        let items = Array.prototype.slice
          .call(document.querySelectorAll("*"))
          .map(function (element) {
            const vw = Math.max(
              document.documentElement.clientWidth || 0,
              window.innerWidth || 0
            );
            const vh = Math.max(
              document.documentElement.clientHeight || 0,
              window.innerHeight || 0
            );

            const rects = [...element.getClientRects()]
              .filter((bb) => {
                const center_x = bb.left + bb.width / 2;
                const center_y = bb.top + bb.height / 2;
                const elAtCenter = document.elementFromPoint(
                  center_x,
                  center_y
                );

                return elAtCenter === element || element.contains(elAtCenter);
              })
              .map((bb) => {
                const rect = {
                  left: Math.max(0, bb.left),
                  top: Math.max(0, bb.top),
                  right: Math.min(vw, bb.right),
                  bottom: Math.min(vh, bb.bottom),
                };
                return {
                  ...rect,
                  width: rect.right - rect.left,
                  height: rect.bottom - rect.top,
                };
              });
            const area = rects.reduce(
              (acc, rect) => acc + rect.width * rect.height,
              0
            );

            return {
              element: element,
              include:
                element.tagName === "INPUT" ||
                element.tagName === "TEXTAREA" ||
                element.tagName === "SELECT" ||
                element.tagName === "BUTTON" ||
                element.tagName === "A" ||
                element.onclick != null ||
                window.getComputedStyle(element).cursor == "pointer" ||
                element.tagName === "IFRAME" ||
                element.tagName === "VIDEO",
              area,
              rects,
              text: element.textContent.trim().replace(/\s{2,}/g, " "),
            };
          })
          .filter((item) => item.include && item.area >= 20);

        // Only keep inner clickable items
        items = items.filter(
          (x) => !items.some((y) => x.element.contains(y.element) && !(x == y))
        );

        items.forEach(function (item, index) {
          item.rects.forEach((bbox) => {
            const newElement = document.createElement("div");
            newElement.id = `ai-label-${index}`;
            const borderColor = getColor(item.element.tagName);
            newElement.style.outline = `2px dashed ${borderColor}`;
            newElement.style.position = "absolute";
            newElement.style.left = bbox.left + window.scrollX + "px";
            newElement.style.top = bbox.top + window.scrollY + "px";
            newElement.style.width = bbox.width + "px";
            newElement.style.height = bbox.height + "px";
            newElement.style.pointerEvents = "none";
            newElement.style.boxSizing = "border-box";
            newElement.style.zIndex = "2147483647";

            // Add floating label at the corner
            const label = document.createElement("span");
            label.textContent = index.toString();
            label.style.position = "absolute";
            label.style.top = "-19px";
            label.style.left = "0px";
            label.style.background = borderColor;
            label.style.color = "white";
            label.style.padding = "2px 4px";
            label.style.fontSize = "12px";
            label.style.borderRadius = "2px";
            newElement.appendChild(label);

            document.body.appendChild(newElement);
            labels.push(newElement);
          });
        });
      };

      addEventListener("mouseover", markPage);
      addEventListener("click", markPage);
      addEventListener("scroll", unmarkPage);
      addEventListener("load", markPage);
    });
    await this.page.hover("body");
  }
}
