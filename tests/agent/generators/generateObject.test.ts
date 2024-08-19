import { describe, expect, it } from "@jest/globals";
import { objectiveStateExample1 } from "../../../src/collectiveMemory/examples";
import { ModelResponseSchema } from "../../../src/types/browser/actionStep.types";
import { commandPrompt, generateObject } from "../../../src/agent";
import { ProviderConfig } from "../../../src/agent/config";

describe("generateObjectLocal", () => {
  it("Should generate an object using the top level function", async () => {
    const messages = commandPrompt(objectiveStateExample1);
    const providerConfig: ProviderConfig = {
      provider: "openai",
      model: "gpt-4-turbo",
      apiKey: process.env.OPENAI_API_KEY!,
    };
    const res = await generateObject(providerConfig, messages, {
      schema: ModelResponseSchema(),
      name: "ModelResponseSchema",
      model: providerConfig.model,
      objectMode: "TOOLS",
    });

    const parsedRes = ModelResponseSchema().parse(res);

    expect(parsedRes.command[0].kind).toBeDefined();
  });
});
