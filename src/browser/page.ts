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
import { debug, generateUUID } from "../utils";
import { BrowserAction } from "../types/browser/actions.types";
import { Inventory } from "../inventory";
import { Agent } from "../agent";
import { DEFAULT_STATE_ACTION_PAIRS } from "../collectiveMemory/examples";

// Do not touch this. We're using undocumented puppeteer APIs
// @ts-ignore
import { MAIN_WORLD } from "puppeteer";
import { memorize } from "../collectiveMemory";
import { ModelResponseType } from "../types";

export class Page {
  page: PuppeteerPage;
  private idMapping: Map<number, any> = new Map();
  private _state: ObjectiveState | undefined = undefined;
  pageId: string;

  ariaTree: string | undefined;

  error: string | undefined;

  constructor(page: PuppeteerPage) {
    this.page = page;
    this.pageId = generateUUID();
  }

  url(): string {
    return this.page.url();
  }

  async content(): Promise<string> {
    return await this.page.evaluate(() => document.body.innerText);
  }

  async setViewport(
    width: number,
    height: number,
    deviceScaleFactor: number = 1
  ) {
    this.page.setViewport({ width, height, deviceScaleFactor });
  }

  async screenshot(): Promise<Buffer> {
    return await this.page.screenshot();
  }

  async html(): Promise<string> {
    return await this.page.content();
  }

  async markdown(): Promise<string> {
    return new Turndown().turndown(await this.html());
  }

  private async getAccessibilityTree(): Promise<SerializedAXNode | null> {
    return await this.page.accessibility.snapshot({ interestingOnly: true });
  }

  async close() {
    await this.page.close();
  }

  async goto(url: string) {
    await this.page.goto(url);
  }
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

  async parseContent(): Promise<string> {
    const tree = await this.getAccessibilityTree();
    debug.write(`Aria tree: ${JSON.stringify(tree)}`);

    this.idMapping = new Map<number, any>();
    let tree_ret = this.simplifyTree(tree!);
    let ret = JSON.stringify(tree_ret);
    return ret;
  }

  async state(
    objective: string,
    objectiveProgress: string[]
  ): Promise<ObjectiveState> {
    let contentJSON = await this.parseContent();
    let content: ObjectiveState = {
      kind: "ObjectiveState",
      url: this.url().replace(/[?].*/g, ""),
      ariaTree: contentJSON,
      progress: objectiveProgress,
      objective: objective,
    };

    this._state = content;
    return content;
  }

  getState(): ObjectiveState | undefined {
    return this._state;
  }

  private async onDOMChange(objective: string, objectiveProgress: string[]) {
    this._state = await this.state(objective, objectiveProgress);
  }

  async performAction(command: BrowserAction, inventory?: Inventory) {
    this.error = undefined;
    try {
      switch (command.kind) {
        case "Click":
          let eClick = await this.findElement(command.index);
          await eClick.click();
          await new Promise((resolve) => setTimeout(resolve, 100));
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
          await new Promise((resolve) => setTimeout(resolve, 100));
          break;
        case "Wait":
          await new Promise((resolve) => setTimeout(resolve, 1000));
          break;
        case "Back":
          await this.page.goBack();
          await new Promise((resolve) => setTimeout(resolve, 100));
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

  async performManyActions(commands: BrowserAction[], inventory?: Inventory) {
    for (let command of commands) {
      await this.performAction(command, inventory);
    }
  }

  async makePrompt(request: string, agent: Agent, progress?: string[]) {
    const state: ObjectiveState = {
      kind: "ObjectiveState",
      url: this.url().replace(/[?].*/g, ""),
      ariaTree: await this.parseContent(),
      progress: progress || [],
      objective: request,
    };

    const prompt = agent.prompt(state, DEFAULT_STATE_ACTION_PAIRS);

    return prompt;
  }

  async generateCommand(request: string, agent: Agent, progress?: string[]) {
    const prompt = await this.makePrompt(request, agent, progress);

    const command = await agent.actionCall(
      prompt,
      z.array(BrowserAction).min(1)
    );
    return command;
  }

  async do(request: string, agent: Agent, inventory?: Inventory) {
    const command = await this.generateCommand(request, agent);
    memorize(this._state!, command as ModelResponseType, this.pageId, {
      endpoint: process.env.HDR_API_ENDPOINT ?? "https://api.hdr.is",
      apiKey: process.env.HDR_API_KEY ?? "",
    });
    await this.performManyActions(command.command, inventory);
  }

  async get<T extends z.ZodSchema<any>>(
    request: string,
    returnType: T,
    agent: Agent
  ): Promise<z.infer<T>> {
    const prompt = await this.makePrompt(request, agent);
    return await agent.returnCall(prompt, returnType);
  }

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
