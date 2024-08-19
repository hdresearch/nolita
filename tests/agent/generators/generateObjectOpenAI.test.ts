import { describe, expect, it } from "@jest/globals";

import { generateObjectOpenAI } from "../../../src/agent/generators/generateObjectOpenAi";

import { objectiveStateExample1 } from "../../../src/collectiveMemory/examples";
import { ModelResponseSchema } from "../../../src/types/browser/actionStep.types";
import { commandPrompt } from "../../../src/agent";

describe("generateObjectOpenAi", () => {
  it("should generate an object with openai", async () => {
    const messages = commandPrompt(objectiveStateExample1);

    const object = await generateObjectOpenAI(
      {
        provider: "openai",
        model: "gpt-4o-2024-08-06",
        apiKey: process.env.OPENAI_API_KEY!,
      },
      messages,
      {
        schema: ModelResponseSchema(),
        name: "ModelResponseSchema",
        model: "gpt-4o-2024-08-06",
        objectMode: "TOOLS",
      }
    );
    expect(object).toBeDefined();
    expect(object!.command[0].kind).toBeDefined();
    expect(object!.command[0].kind).toBe("Type");
  });
});
