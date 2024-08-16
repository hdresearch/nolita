import { describe, expect, it } from "@jest/globals";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObjectProvider } from "../../../src/agent/generators/generateObjectProvider";
import { objectiveStateExample1 } from "../../../src/collectiveMemory/examples";
import { ModelResponseSchema } from "../../../src/types/browser/actionStep.types";
import { commandPrompt } from "../../../src/agent";
import { generateObjectOpenAI } from "../../../src/agent/generators/generateObjectOpenAi";

describe("generateObjectProvider", () => {
  it("should return the object provider", async () => {
    const messages = commandPrompt(objectiveStateExample1);
    const res = await generateObjectOpenAI(
      {
        provider: "openai",
        model: "gpt-4o-2024-08-06",
        apiKey: process.env.OPENAI_API_KEY!,
      },
      messages,
      {
        schema: ModelResponseSchema(),
        name: "ModelResponseSchema",
        model: "gpt-4-turbo",
        objectMode: "TOOLS",
      }
    );
    console.log(res);
    expect(res!.command[0].kind).toBe("Type");
  }, 30000);

  it.skip("Should generate an object with claude", async () => {
    const client = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const messages = commandPrompt(objectiveStateExample1);

    const res = await generateObjectProvider(
      {
        provider: "anthropic",
        model: "claude-3-opus-20240229",
        apiKey: process.env.OPENAI_API_KEY!,
      },
      client,
      messages,
      {
        schema: ModelResponseSchema(),
        name: "ModelResponseSchema",
        model: "claude-3-opus-20240229",
        objectMode: "TOOLS",
      }
    );

    expect(res.command[0].kind).toBe("Type");
  }, 30000);
});
