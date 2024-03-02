import {
  describe,
  expect,
  test,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";

import { Agent } from "../../src/agent/agent";
import { OpenAIChatApi } from "llm-api";
import {
  objectiveStateExample1,
  stateActionPair1,
} from "../../src/memories/examples";
import {
  ModelResponseSchema,
  ModelResponseType,
} from "../../src/types/browser/actionStep.types";

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
    // TODO: add test content
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
    expect(response!.command).toStrictEqual([
      { index: 5, kind: "Type", text: "gadget 11 pro price" },
    ]);

    expect(response!.randomNumber).toBeGreaterThanOrEqual(0);
  });
});