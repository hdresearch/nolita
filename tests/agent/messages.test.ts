import { describe, expect, it } from "@jest/globals";
import {
  commandPrompt,
  getPrompt,
  handleConfigMessages,
} from "../../src/agent/messages";
import { Inventory } from "../../src/inventory";

import { stateActionPair1 } from "../../src/collectiveMemory/examples";

describe("handleConfigMessages", () => {
  it("should return a system prompt message", () => {
    const messages = handleConfigMessages({ systemPrompt: "test" });
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toBe("test");
  });

  it("should return an inventory message", () => {
    const messages = handleConfigMessages({
      inventory: new Inventory([
        { value: "test", name: "test", type: "string" },
      ]),
    });
    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toContain("Use the following information");
  });

  it("should return both messages", () => {
    const messages = handleConfigMessages({
      systemPrompt: "test",
      inventory: new Inventory([
        { value: "test", name: "test", type: "string" },
      ]),
    });
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toBe("test");
    expect(messages[1].role).toBe("user");
    expect(messages[1].content).toContain("Use the following information");
  });
});

describe("CommandPrompt", () => {
  it("should return a command prompt with no extra messages", () => {
    const messages = commandPrompt(stateActionPair1.objectiveState);
    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toContain(
      "Please generate the next ActionStep for"
    );

    expect(messages.length).toBe(1);
  });

  it("should return a command prompt with an inventory message", () => {
    const messages = commandPrompt(
      stateActionPair1.objectiveState,

      {
        memories: [stateActionPair1],
        inventory: new Inventory([
          { value: "test", name: "test", type: "string" },
        ]),
      }
    );

    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toContain(
      "Use the following information to achieve your objective as needed"
    );

    expect(messages[2].role).toBe("user");
    expect(messages[2].content).toContain(
      "Please generate the next ActionStep for"
    );

    expect(messages.length).toBe(3);
  });

  it("should return a command prompt with a system prompt", () => {
    const messages = commandPrompt(stateActionPair1.objectiveState, {
      systemPrompt: "test",
    });
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toBe("test");

    expect(messages[1].role).toBe("user");
    expect(messages[1].content).toContain(
      "Please generate the next ActionStep for"
    );

    expect(messages.length).toBe(2);
  });

  it("should return a command prompt with a system prompt and an inventory message", () => {
    const messages = commandPrompt(stateActionPair1.objectiveState, {
      memories: [stateActionPair1],
      systemPrompt: "test",
    });
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toBe("test");

    expect(messages[1].role).toBe("user");
    expect(messages[1].content).toContain(
      "Here are examples of a previous request"
    );

    expect(messages[2].role).toBe("user");
    expect(messages[2].content).toContain(
      "Please generate the next ActionStep for"
    );

    expect(messages.length).toBe(3);
  });

  it("should return a command prompt with memories", () => {
    const messages = commandPrompt(stateActionPair1.objectiveState, {
      memories: [stateActionPair1],
    });

    expect(messages[1].role).toBe("user");
    expect(messages[1].content).toContain(
      "Please generate the next ActionStep for"
    );

    expect(messages.length).toBe(2);
  });
});

describe("getPrompt", () => {
  const inventory = new Inventory([
    { value: "test", name: "test", type: "string" },
  ]);

  it("should return a get prompt with no extra messages", () => {
    const messages = getPrompt(stateActionPair1.objectiveState.ariaTree);
    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toContain(
      "Here is the current aria of the page"
    );

    expect(messages.length).toBe(1);
  });

  it("should return a get prompt with an inventory message", () => {
    const messages = getPrompt(stateActionPair1.objectiveState.ariaTree, {
      inventory,
    });

    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toContain(
      "Use the following information to achieve your objective as needed"
    );

    expect(messages[1].role).toBe("user");
    expect(messages[1].content).toContain(
      "Here is the current aria of the page"
    );

    expect(messages.length).toBe(2);
  });

  it("should return a get prompt with a system prompt", () => {
    const messages = getPrompt(stateActionPair1.objectiveState.ariaTree, {
      systemPrompt: "test",
    });
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toBe("test");

    expect(messages[1].role).toBe("user");
    expect(messages[1].content).toContain(
      "Here is the current aria of the page"
    );

    expect(messages.length).toBe(2);
  });

  it("should return a get prompt with a system prompt and an inventory message", () => {
    const messages = commandPrompt(stateActionPair1.objectiveState, {
      memories: [stateActionPair1],
      systemPrompt: "test",
    });
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toBe("test");

    expect(messages[1].role).toBe("user");
    expect(messages[1].content).toContain(
      "Here are examples of a previous request"
    );

    expect(messages[2].role).toBe("user");
    expect(messages[2].content).toContain(
      "Please generate the next ActionStep for"
    );

    expect(messages.length).toBe(3);
  });

  it("should return a get prompt without memories", () => {
    const messages = getPrompt(stateActionPair1.objectiveState.ariaTree, {
      memories: [stateActionPair1],
    });

    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toContain(
      "Here is the current aria of the page"
    );

    expect(messages.length).toBe(1);
  });
});
