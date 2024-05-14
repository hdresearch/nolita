import {
  Page as PuppeteerPage,
  ElementHandle,
  SerializedAXNode,
  CDPSession,
  Protocol,
} from "puppeteer";

import { z } from "zod";
import Turndown from "turndown";

import {
  AccessibilityTree,
  ObjectiveState,
} from "../types/browser/browser.types";
import { Logger, debug, generateUUID } from "../utils";
import { BrowserAction } from "../types/browser/actions.types";
import { Inventory } from "../inventory";
import { Agent } from "../agent";
import { DEFAULT_STATE_ACTION_PAIRS } from "../collectiveMemory/examples";

// Do not touch this. We're using undocumented puppeteer APIs
// @ts-ignore
import { MAIN_WORLD } from "puppeteer";
import { memorize } from "../collectiveMemory";
import { ModelResponseType } from "../types";

/**
 * Represents a web page and provides methods to interact with it.
 */
export class Page {
  page: PuppeteerPage;
  private idMapping: Map<number, any> = new Map();
  private _state: ObjectiveState | undefined = undefined;
  private inventory: Inventory | undefined;

  pageId: string;
  agent: Agent;
  logger?: Logger;

  error: string | undefined;

  /**
   * Creates a new Page instance.
   * @param {PuppeteerPage} page - The PuppeteerPage object representing the browser page.
   * @param {Agent} agent - The Agent object representing the user agent interacting with the page.
   * @param {Object} [opts] - Optional parameters for additional configuration.
   * @param {string} [opts.pageId] - An optional unique identifier for the page; if not provided, a UUID will be generated.
   * @param {Logger} [opts.logger] - An optional logger for logging events; if not provided, logging may be absent.
   * @param {Inventory} [opts.inventory] - An optional inventory object for storing and retrieving user data.
   */
  constructor(
    page: PuppeteerPage,
    agent: Agent,
    opts?: { pageId?: string; logger?: Logger; inventory?: Inventory }
  ) {
    this.page = page;
    this.agent = agent;
    this.pageId = opts?.pageId ?? generateUUID();
    this.logger = opts?.logger;
    this.inventory = opts?.inventory;
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
   * @param height The height of the viewport.
   * @param deviceScaleFactor The device scale factor (default: 1).
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
  }

  /**
   * Queries the accessibility tree of an element.
   * @param client The CDP session client.
   * @param element The element to query.
   * @param accessibleName The accessible name of the element.
   * @param role The role of the element.
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
   * @param {index} index The index of the element in the ID mapping.
   * @returns A promise that resolves to the found element handle.
   */
  private async findElement(index: number): Promise<ElementHandle<Element>> {
    let e = this.idMapping.get(index);
    let role = e[1];
    let name = e[2];

    let client = (this.page as any)._client();
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
      // this is black magic referred to the execution context
      // @ts-ignore
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
   * @param node The serialized accessibility node to simplify.
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
    let index = this.idMapping.size;
    let e: AccessibilityTree = [index, node.role, node.name!];
    this.idMapping.set(index, e);
    let children = [] as AccessibilityTree[];
    if (node.children) {
      const self = this;
      children = node.children.map((child) => self.simplifyTree(child));
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
    let tree_ret = this.simplifyTree(tree!);
    let ret = JSON.stringify(tree_ret);
    return ret;
  }

  /**
   * Retrieves the current state of the page based on the objective and progress.
   * @param objective The objective of the page.
   * @param objectiveProgress The progress of the objective.
   * @returns A promise that resolves to the objective state of the page.
   */
  async state(
    objective: string,
    objectiveProgress: string[]
  ): Promise<ObjectiveState> {
    let contentJSON = await this.parseContent();
    let content = ObjectiveState.parse({
      kind: "ObjectiveState",
      url: this.url().replace(/[?].*/g, ""),
      ariaTree: contentJSON,
      progress: objectiveProgress,
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
   * @param command The browser action to perform.
   * @param inventory The inventory object (optional).
   * @param delay The delay in milliseconds after performing the action (default: 100).
   */
  async performAction(
    command: BrowserAction,
    opts?: { inventory?: Inventory; delay?: number }
  ) {
    const inventory = opts?.inventory ?? this.inventory;
    const delay = opts?.delay ?? 100;
    this.error = undefined;
    try {
      switch (command.kind) {
        case "Click":
          let eClick = await this.findElement(command.index);
          await eClick.click();
          await new Promise((resolve) => setTimeout(resolve, delay));
          break;

        case "Type":
          let text = command.text;

          // repalce masked inventory values with real values
          if (inventory) {
            text = inventory.replaceMask(text);
          }

          let eType = await this.findElement(command.index);
          await eType.click({ clickCount: 3 }); // click to select all text
          await eType.type(text + "\n");
          await new Promise((resolve) => setTimeout(resolve, delay));
          break;
        case "Wait":
          await new Promise((resolve) => setTimeout(resolve, 1000));
          break;
        case "Back":
          await this.page.goBack();
          await new Promise((resolve) => setTimeout(resolve, delay));
          break;
        case "Hover":
          let eHover = await this.findElement(command.index);
          await eHover.hover();
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
   * @param inventory The inventory object (optional).
   */
  async performManyActions(
    commands: BrowserAction[],
    opts?: { delay?: number; inventory?: Inventory }
  ) {
    for (let command of commands) {
      await this.performAction(command, opts);
    }
  }

  /**
   * Creates a prompt for the agent based on the request and current state.
   * @param request The request or objective.
   * @param agent The agent to create the prompt for.
   * @param progress The progress of the objective (optional).
   * @returns A promise that resolves to the created prompt.
   */
  async makePrompt(
    request: string,
    progress?: string[],
    opts?: { agent?: Agent }
  ) {
    const state = (await this.state(request, progress ?? [])) as ObjectiveState;
    const agent = opts?.agent ?? this.agent;
    const prompt = agent.prompt(state, DEFAULT_STATE_ACTION_PAIRS);

    return prompt;
  }

  /**
   * Generates a command based on the request and current state.
   * @param request The request or objective.
   * @param agent The agent to generate the command for.
   * @param progress The progress of the objective (optional).
   * @returns A promise that resolves to the generated command.
   */
  async generateCommand(
    request: string,
    progress?: string[],
    opts?: { agent?: Agent }
  ) {
    const agent = opts?.agent ?? this.agent;
    const prompt = await this.makePrompt(request, progress, { agent });

    const command = await agent.actionCall(
      prompt,
      z.array(BrowserAction).min(1)
    );
    return command;
  }

  /**
   * Performs a request on the page.
   * @param request The request or objective.
   * @param opts Additional options.
   * @param opts.agent The agent to use (optional).
   * @param opts.inventory The inventory object (optional).
   */
  async do(
    request: string,
    opts?: {
      agent?: Agent;
      inventory?: Inventory;
      progress?: string[];
      delay?: number;
    }
  ) {
    const agent = opts?.agent ?? this.agent;
    const inventory = opts?.inventory;
    const command = await this.generateCommand(request, opts?.progress, {
      agent,
    });
    this.log(JSON.stringify(command));
    memorize(this._state!, command as ModelResponseType, this.pageId, {
      endpoint: process.env.HDR_API_ENDPOINT ?? "https://api.hdr.is",
      apiKey: process.env.HDR_API_KEY ?? "",
    });
    await this.performManyActions(command.command, {
      inventory,
      delay: opts?.delay,
    });
  }

  /**
   * Retrieves data from the page based on the request and return type.
   * @template T The type of the return value.
   * @param request The request or objective.
   * @param returnType The Zod schema for the return type.
   * @param opts Additional options.
   * @param opts.agent The agent to use (optional).
   * @returns A promise that resolves to the retrieved data.
   */
  async get<T extends z.ZodSchema<any>>(
    request: string,
    returnType: T,
    opts?: { agent?: Agent; progress?: string[] }
  ): Promise<z.infer<T>> {
    const agent = opts?.agent ?? this.agent;
    const prompt = await this.makePrompt(request, opts?.progress, { agent });
    const result = await agent.returnCall(prompt, returnType);
    this.log(JSON.stringify(result));
    return result;
  }

  /**
   * Injects bounding boxes around clickable elements on the page.
   */
  async injectBoundingBoxes() {
    await this.page.evaluate(() => {
      // @ts-ignore
      var labels = [];

      const unmarkPage = () => {
        // @ts-ignore
        for (const label of labels) {
          document.body.removeChild(label);
        }
        labels = [];
      };

      // Function to generate random colors
      // @ts-ignore
      function getColor(elementType) {
        const colorMapping = {
          INPUT: "#FF0000", // Red for input fields
          TEXTAREA: "#00FF00", // Green for textareas
          SELECT: "#0000FF", // Blue for select dropdowns
          BUTTON: "#FFFF00", // Yellow for buttons
          A: "#FF00FF", // Magenta for links
          DEFAULT: "#CCCCCC", // Grey for any other elements
        };
        // @ts-ignore
        return colorMapping[elementType] || colorMapping.DEFAULT;
      }

      const markPage = () => {
        unmarkPage();

        var bodyRect = document.body.getBoundingClientRect();

        var items = Array.prototype.slice
          .call(document.querySelectorAll("*"))
          .map(function (element) {
            var vw = Math.max(
              document.documentElement.clientWidth || 0,
              window.innerWidth || 0
            );
            var vh = Math.max(
              document.documentElement.clientHeight || 0,
              window.innerHeight || 0
            );

            var rects = [...element.getClientRects()]
              .filter((bb) => {
                var center_x = bb.left + bb.width / 2;
                var center_y = bb.top + bb.height / 2;
                var elAtCenter = document.elementFromPoint(center_x, center_y);

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
            var area = rects.reduce(
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
            var newElement = document.createElement("div");
            newElement.id = `ai-label-${index}`;
            var borderColor = getColor(item.element.tagName);
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
            var label = document.createElement("span");
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
            //@ts-ignore
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
