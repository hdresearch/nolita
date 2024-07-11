import { describe, expect, test, it, beforeAll } from "@jest/globals";

import { Agent } from "../../src/agent/agent";
import {
  objectiveStateExample1,
  stateActionPair1,
} from "../../src/collectiveMemory/examples";
import {
  ModelResponseSchema,
  ObjectiveComplete,
} from "../../src/types/browser/actionStep.types";

import { Inventory } from "../../src/inventory";

import { z } from "zod";
import { ObjectiveState } from "../../src/types/browser";
import { completionApiBuilder } from "../../src/agent/config";

describe("Agent -- configs", () => {
  let agent: Agent;
  beforeAll(() => {
    const providerOptions = {
      apiKey: process.env.OPENAI_API_KEY!,
      provider: "openai",
    };

    const chatApi = completionApiBuilder(providerOptions, {
      model: "gpt-4-turbo",
      objectMode: "TOOLS",
    });

    agent = new Agent({ modelApi: chatApi! });
  });

  test("that configs are handled", async () => {
    const prompt = await agent.prompt(
      stateActionPair1.objectiveState,
      [stateActionPair1],
      {
        inventory: new Inventory([
          { value: "test", name: "test", type: "string" },
        ]),
      }
    );
    expect(prompt[0].role).toBe("user");
    expect(prompt[0].content).toContain("Use the following information");
  });

  test("that empty configs are handled", async () => {
    const prompt = await agent.prompt(
      stateActionPair1.objectiveState,
      [stateActionPair1],
      {}
    );
    expect(prompt[0].role).toBe("user");
    expect(prompt[0].content).toContain("Here are examples of a request");
  });
});

describe("Agent", () => {
  let agent: Agent;

  beforeAll(() => {
    const providerOptions = {
      apiKey: process.env.OPENAI_API_KEY!,
      provider: "openai",
    };

    const chatApi = completionApiBuilder(providerOptions, {
      model: "gpt-4-turbo",
      objectMode: "TOOLS",
      maxRetries: 5,
    });

    agent = new Agent({ modelApi: chatApi! });
  });

  test("Agent can prompt", async () => {
    const prompt = await agent.prompt(
      stateActionPair1.objectiveState,
      [stateActionPair1],
      {}
    );
    expect(prompt[0].role).toBe("user");
    expect(prompt[0].content).toContain(
      `{"objectiveState":{"kind":"ObjectiveState","objective":"how much is an gadget 11 pro","progress":[]`
    );
  });

  test("ask command", async () => {
    const prompt = await agent.prompt(
      objectiveStateExample1,
      [stateActionPair1],
      {}
    );

    const response = await agent.call(
      prompt,
      ModelResponseSchema(ObjectiveComplete)
    );
    const res = ModelResponseSchema(ObjectiveComplete).parse(response);
    if (res.kind !== "Command") {
      throw new Error("Response is not a command");
    }
    expect(res.command).toStrictEqual([
      { index: 5, kind: "Type", text: "gadget 11 pro price" },
    ]);
  });

  test("that it should return an abitrary type", async () => {
    const prompt = await agent.prompt(
      objectiveStateExample1,
      [stateActionPair1],
      {}
    );

    const testSchema = ObjectiveComplete.extend({
      randomNumber: z
        .number()
        .describe("generate a random number greater than zero"),
    });

    const response = await agent.call(prompt, ModelResponseSchema(testSchema));
    const res = ModelResponseSchema(testSchema).parse(response);
    if (res.kind !== "Command") {
      throw new Error("Response is not a command");
    }
    expect(res.command).toStrictEqual([
      { index: 5, kind: "Type", text: "gadget 11 pro price" },
    ]);

    expect(ModelResponseSchema(testSchema).parse(res)).toBeDefined();
  });

  test("that askCommandWorks", async () => {
    const prompt = await agent.prompt(
      objectiveStateExample1,
      [stateActionPair1],
      {}
    );
    const response = await agent.askCommand(
      prompt,
      ModelResponseSchema(ObjectiveComplete)
    );
    expect(response!.command).toStrictEqual([
      { index: 5, kind: "Type", text: "gadget 11 pro price" },
    ]);
  });

  it("should follow a system prompt", async () => {
    const providerOptions = {
      apiKey: process.env.OPENAI_API_KEY!,
      provider: "openai",
    };

    const chatApi = completionApiBuilder(providerOptions, {
      model: "gpt-4-turbo",
      objectMode: "TOOLS",
    });

    agent = new Agent({ modelApi: chatApi! });
    const response = await agent.chat("respond with `hello` and nothing more.");
    expect(response).toBe("hello");
  });

  it("Should correctly modify the actions", async () => {
    const modifiedObjectiveStateExample1: ObjectiveState = {
      kind: "ObjectiveState",
      objective: "how much is an gadget 11 pro",
      progress: [],
      url: "https://www.google.com/",
      ariaTree: `[0,"RootWebArea","Google",[[1,"link","Gmail"],[2,"link","Images"],[3,"button","Google apps"],[4,"link","Sign in"],["img","Google"],[20,"combobox","Search"]]]`,
    };

    const res = await agent.modifyActions(
      modifiedObjectiveStateExample1,
      stateActionPair1
    );
    if (res && res.kind !== "Command") {
      throw new Error("Response is not a command");
    }
    expect(res?.command[0].index).toStrictEqual(20);
  });

  it("Should generate a command", async () => {
    const prompt = await agent.prompt(objectiveStateExample1, [
      stateActionPair1,
    ]);
    const response = await agent.actionCall(
      prompt,
      ModelResponseSchema(ObjectiveComplete)
    );

    expect(response?.command[0].index).toStrictEqual(5);
  });

  it("Should return a response with a custom schema", async () => {
    objectiveStateExample1.objective = "tell me what this website is";
    const prompt = await agent.prompt(objectiveStateExample1, [
      stateActionPair1,
    ]);
    const response = await agent.returnCall(
      prompt,
      ObjectiveComplete.extend({
        website: z.string().describe("The website name"),
      })
    );

    console.log("Response:", response);
    expect(response.website).toBeDefined();
    expect(response.website.toLowerCase()).toContain("google");
  }, 10000);
});
