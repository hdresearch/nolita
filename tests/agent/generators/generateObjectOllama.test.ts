import { describe, expect, it } from "@jest/globals";
import "openai/shims/web";
import { generateObjectOllama } from "../../../src/agent/generators/generateObjectOllama";
import { objectiveStateExample1 } from "../../../src/collectiveMemory/examples";
import { ModelResponseSchema } from "../../../src/types/browser/actionStep.types";
import { commandPrompt } from "../../../src/agent";

describe("generateObjectLocal", () => {
  it("Should generate an object with ollama", async () => {
    const messages = commandPrompt(objectiveStateExample1);
    const res = await generateObjectOllama("openhermes:v2.5", messages, {
      schema: ModelResponseSchema(),
      name: "ModelResponseSchema",
      model: "openhermes:v2.5",
      objectMode: "TOOLS",
    });

    expect(res.object.command[0].kind).toBeDefined();
  });
});
