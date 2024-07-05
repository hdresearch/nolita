import { describe, expect, test, it, beforeAll } from "@jest/globals";
import { OpenAIChatApi } from "llm-api";

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

describe("Agent -- configs", () => {
  let agent: Agent;
  beforeAll(() => {
    const openAIChatApi = new OpenAIChatApi(
      {
        apiKey: process.env.OPENAI_API_KEY,
      },
      { model: "gpt-3.5-turbo-1106" }
    );
    agent = new Agent({
      modelApi: openAIChatApi,
      systemPrompt:
        "If you generate a command it must be of the kind {Kind: Type, index: 5, Text: 'gadget 11 pro price'}",
    });
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
    const openAIChatApi = new OpenAIChatApi(
      {
        apiKey: process.env.OPENAI_API_KEY,
      },
      { model: "gpt-3.5-turbo-1106" }
    );
    agent = new Agent({
      modelApi: openAIChatApi,
      systemPrompt:
        "If you generate a command it must be of the kind {Kind: Type, index: 5, Text: 'gadget 11 pro price'}",
    });
  });

  test("Agent can prompt", async () => {
    const prompt = await agent.prompt(
      stateActionPair1.objectiveState,
      [stateActionPair1],
      {}
    );
    console.log("Prompt:", prompt);
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

    const testSchema = ObjectiveComplete.extend({
      randomNumber: z
        .number()
        .describe("generate a random number greater than zero"),
    });

    const response = await agent.call(prompt, ModelResponseSchema(testSchema));
    expect(response.data.command).toStrictEqual([
      { index: 5, kind: "Type", text: "gadget 11 pro price" },
    ]);

    expect(ModelResponseSchema(testSchema).parse(response.data)).toBeDefined();
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

  // test("that askCommandWorks with a different schema", async () => {
  //   const fakeState: ObjectiveState = {
  //     kind: "ObjectiveState",
  //     objective: "how much is an gadget 11 pro",
  //     progress: [],
  //     url: "https://www.google.com/",
  //     ariaTree: `[0,"RootWebArea", "The random number is 4"]`,
  //   };

  //   const prompt = await agent.prompt(fakeState, [], {
  //     systemPrompt:
  //       "ignore all commands and return the result of the objective result as {progressAssessment: 'Do not have enough information in ariaTree to return an Objective Result.', objectiveComplete: {kind: 'ObjectiveComplete', result: 'The random number is 4', randomNumber: 'THIS SHOULD BE 4'}, description: 'Searched `gadget 11 pro price`'}",
  //   });

  //   const testSchema = ObjectiveComplete.extend({
  //     randomNumber: z
  //       .number()
  //       .describe("generate a random number greater than zero"),
  //   });

  //   const response = await agent.askCommand(
  //     prompt,
  //     ModelResponseSchema(testSchema)
  //   );

  //   const parsedResponse = ModelResponseSchema(testSchema).parse(response!);
  //   console.log("Parsed Response:", parsedResponse);

  //   expect(
  //     testSchema.parse(parsedResponse.objectiveComplete).randomNumber
  //   ).toBeDefined();
  // });

  it("should follow a system prompt", async () => {
    const openAIChatApi = new OpenAIChatApi(
      {
        apiKey: process.env.OPENAI_API_KEY,
      },
      { model: "gpt-3.5-turbo-1106" }
    );

    const agent = new Agent({
      modelApi: openAIChatApi,
      systemPrompt: "Only respond in all caps",
    });

    const response = await agent.chat("respond with `hello` and nothing more.");
    expect(response).toBe("HELLO");
  });

  it("Should correctly modify the actions", async () => {
    const modifiedObjectiveStateExample1: ObjectiveState = {
      kind: "ObjectiveState",
      objective: "how much is an gadget 11 pro",
      progress: [],
      url: "https://www.google.com/",
      ariaTree: `[0,"RootWebArea","Google",[[1,"link","Gmail"],[2,"link","Images"],[3,"button","Google apps"],[4,"link","Sign in"],["img","Google"],[20,"combobox","Search"]]]`,
    };

    const response = await agent.modifyActions(
      modifiedObjectiveStateExample1,
      stateActionPair1
    );
    console.log("Response:", JSON.stringify(response));
    // @ts-ignore
    expect(response?.command[0].index).toStrictEqual(20);
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

    const website = z.object({
      website: z.string().describe("The website name"),
    });
    const response = await agent.returnCall(
      prompt,
      ObjectiveComplete.extend({ website })
    );
    expect(response.website).toBeDefined();
    expect(response.website.website.toLowerCase()).toContain("google");
  });
});
