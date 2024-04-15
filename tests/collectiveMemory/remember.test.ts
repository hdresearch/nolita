import { describe, expect, it } from "@jest/globals";
import { remember, fetchMemorySequence } from "../../src/collectiveMemory";
import { objectiveStateExample1 } from "../../src/collectiveMemory/examples";

describe("Remember", () => {
  it("should remember", async () => {
    const memories = await remember(objectiveStateExample1, {
      apiKey: process.env.HDR_API_KEY!,
      endpoint: process.env.HDR_ENDPOINT!,
    });

    const memory = memories[0].actionStep.command![0];
    expect(memory.kind).toBe("Type");
  });
});

describe("Fetch state actions sequences", () => {
  it("should fetch state actions sequences", async () => {
    const stateActionPairs = await fetchMemorySequence(
      "9eaa1d07-1c3d-4e32-867c-f26a8947f1dd",
      {
        apiKey: process.env.HDR_API_KEY!,
        endpoint: "https://api.hdr.is",
      }
    );
    expect(stateActionPairs.length).toBe(5);
  });
});
