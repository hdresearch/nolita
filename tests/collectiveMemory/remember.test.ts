import { describe, expect, it } from "@jest/globals";
import {
  remember,
  fetchMemorySequence,
  fetchStateActionPairs,
} from "../../src/collectiveMemory";
import {
  objectiveStateExample1,
  objectiveStateExample2,
} from "../../src/collectiveMemory/examples";

describe("Remember", () => {
  it("should remember", async () => {
    const memories = await remember(
      objectiveStateExample2,
      "9eaa1d07-1c3d-4e32-867c-f26a8947f1dd",
      {
        apiKey: process.env.HDR_API_KEY!,
        endpoint: process.env.HDR_ENDPOINT!,
      }
    );

    const memory = memories[0].actionStep.command![0];
    expect(memory.kind).toBe("Type");
  }, 10000);

  it("should remember", async () => {
    const memories = await remember(
      objectiveStateExample1,
      "9eaa1d07-1c3d-4e32-867c-f26a8947f1dd",
      {
        apiKey: process.env.HDR_API_KEY!,
        endpoint: process.env.HDR_ENDPOINT!,
      }
    );

    const memory = memories[0].actionStep.command![0];
    expect(memory.kind).toBe("Type");
  }, 10000);
});

describe("Fetch state actions pairs", () => {
  it("should fetch state actions pairs", async () => {
    const uuid = "9eaa1d07-1c3d-4e32-867c-f26a8947f1dd";
    const stateActionPairs = await fetchStateActionPairs(
      objectiveStateExample1,
      uuid,
      {
        apiKey: process.env.HDR_API_KEY!,
        endpoint: process.env.HDR_ENDPOINT!,
      }
    );
    expect(stateActionPairs.length).toBe(2);
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
