import { describe, expect, it } from "@jest/globals";
import "openai/shims/web";
import OpenAI from "openai";
import { generateObjectProvider } from "../../src/agent/generators/generateObjectProvider";
import { objectiveStateExample1 } from "../../src/collectiveMemory/examples";
import { ModelResponseSchema } from "../../src/types/browser/actionStep.types";
import { commandPrompt } from "../../src/agent";

describe("generateObjectProvider", () => {
  it("should return the object provider", async () => {
    const client = new OpenAI();

    const messages = commandPrompt(objectiveStateExample1);
    const res = await generateObjectProvider(client, messages, {
      schema: ModelResponseSchema(),
      name: "ModelResponseSchema",
      model: "gpt-4-turbo",
      objectMode: "TOOLS",
    });

    expect(res.command[0].kind).toBe("Type");
  }, 10000);
});
