import {
  Page as PuppeteerPage,
  ElementHandle,
  SerializedAXNode,
  CDPSession,
  Protocol,
} from "puppeteer";

import { z } from "zod";

import {
  AccessibilityTree,
  ObjectiveState,
} from "../types/browser/browser.types";
import { debug } from "../utils";
import { BrowserAction } from "../types/browser/actions.types";
import { Inventory } from "../inventory";
import { Agent } from "../agent";
import { BrowserActionSchemaArray } from "../types";
import { DEFAULT_STATE_ACTION_PAIRS } from "../collectiveMemory/examples";

// Do not touch this. We're using undocumented puppeteer APIs
// @ts-ignore
import { MAIN_WORLD } from "puppeteer";

export class Page {
  page: PuppeteerPage;
  private idMapping: Map<number, any> = new Map();
  private _state: ObjectiveState | undefined = undefined;

  ariaTree: string | undefined;

  error: string | undefined;

  constructor(page: PuppeteerPage) {
    this.page = page;
  }

  url(): string {
    return this.page.url();
  }

  async content(): Promise<string> {
    return await this.page.evaluate(() => document.body.innerText);
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
          console.log("Clicking on element with index", command.index);
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
      console.error(e);
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
}
