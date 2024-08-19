import { describe, expect, it } from "@jest/globals";
import { objectiveStateExample1 } from "../../../src/collectiveMemory/examples";
import { ModelResponseSchema } from "../../../src/types/browser/actionStep.types";
import { commandPrompt } from "../../../src/agent";
import { generateObjectInstructor } from "../../../src/agent/generators/generateObjectInstructor";
import { ProviderConfig } from "../../../src/agent/config";

describe("generateObjectLocal", () => {
  it.skip("Should generate an object with ollama", async () => {
    const messages = commandPrompt(objectiveStateExample1);
    const providerConfig: ProviderConfig = {
      provider: "openai",
      model: "gpt-4-turbo",
      apiKey: process.env.OPENAI_API_KEY!,
    };
    const res = await generateObjectInstructor(providerConfig, messages, {
      schema: ModelResponseSchema(),
      name: "ModelResponseSchema",
      model: "openhermes:v2.5",
      objectMode: "TOOLS",
    });

    expect(res.object.command[0].kind).toBeDefined();
  });
});
