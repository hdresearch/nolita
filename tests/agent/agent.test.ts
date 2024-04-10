import { describe, expect, test, it, beforeAll } from "@jest/globals";
import { OpenAIChatApi } from "llm-api";

import { Agent } from "../../src/agent/agent";
import {
  objectiveStateExample1,
  stateActionPair1,
} from "../../src/collectiveMemory/examples";
import { ModelResponseSchema } from "../../src/types/browser/actionStep.types";

import { Inventory } from "../../src/inventory";

import { z } from "zod";

describe("Agent", () => {
  let agent: Agent;

  beforeAll(() => {
    const openAIChatApi = new OpenAIChatApi(
      {
        apiKey: process.env.OPENAI_API_KEY,
      },
      { model: "gpt-3.5-turbo-1106" }
    );
    agent = new Agent(openAIChatApi);
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

  test("ask command", async () => {
    const prompt = await agent.prompt(
      objectiveStateExample1,
      [stateActionPair1],
      {}
    );

    const response = await agent.call(prompt, ModelResponseSchema);
    expect(response.data.command).toStrictEqual([
      { index: 5, kind: "Type", text: "gadget 11 pro price" },
    ]);
  });

  test("that it should return an abitrary type", async () => {
    const prompt = await agent.prompt(
      objectiveStateExample1,
      [stateActionPair1],
      {}
    );

    const testSchema = ModelResponseSchema.extend({
      randomNumber: z
        .number()
        .describe("generate a random number greater than zero"),
    });

    const response = await agent.call(prompt, testSchema);
    expect(response.data.command).toStrictEqual([
      { index: 5, kind: "Type", text: "gadget 11 pro price" },
    ]);

    expect(response.data.randomNumber).toBeGreaterThanOrEqual(0);
    expect(ModelResponseSchema.parse(response.data)).toBeDefined();
  });

  test("that askCommandWorks", async () => {
    const prompt = await agent.prompt(
      objectiveStateExample1,
      [stateActionPair1],
      {}
    );
    const response = await agent.askCommand(prompt, ModelResponseSchema);
    expect(response!.command).toStrictEqual([
      { index: 5, kind: "Type", text: "gadget 11 pro price" },
    ]);
  });

  test("that askCommandWorks with a different schema", async () => {
    const prompt = await agent.prompt(
      objectiveStateExample1,
      [stateActionPair1],
      {}
    );
    const testSchema = ModelResponseSchema.extend({
      randomNumber: z
        .number()
        .describe("generate a random number greater than zero"),
    });

    const response = await agent.askCommand(prompt, testSchema);
    if (response!.command && response!.command.length > 0) {
      const command = response!.command[0];
      if ("index" in command) {
        expect(command.kind).toBe("Type");
        expect(command.index).toBe(5);
      }
    }
    expect(response!.randomNumber).toBeGreaterThanOrEqual(0);
  });

  it("should follow a system prompt", async () => {
    const openAIChatApi = new OpenAIChatApi(
      {
        apiKey: process.env.OPENAI_API_KEY,
      },
      { model: "gpt-3.5-turbo-1106" }
    );

    const agent = new Agent(openAIChatApi, "Only respond in all caps");

    const response = await agent.chat("respond with hello and nothing more.");
    expect(response).toBe("HELLO");
  });
});
