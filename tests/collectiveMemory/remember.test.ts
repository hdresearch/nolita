import { describe, expect, it } from "@jest/globals";
import { remember, fetchMemorySequence } from "../../src/collectiveMemory";
import {
  objectiveStateExample1,
  objectiveStateExample2,
} from "../../src/collectiveMemory/examples";

describe("Remember", () => {
  it("should remember", async () => {
    console.log("Endpoint", process.env.HDR_ENDPOINT);
    const memories = await remember(objectiveStateExample2, {
      apiKey: "hdr-24aceaa62a28cabf96afbd720816484",
      endpoint: process.env.HDR_ENDPOINT!,
    });

    console.log(JSON.stringify(memories, null, 2));

    const memory = memories[0].actionStep.command![0];
    expect(memory.kind).toBe("Type");
  }, 10000);
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
