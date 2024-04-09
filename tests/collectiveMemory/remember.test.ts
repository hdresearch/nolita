import { describe, expect, it } from "@jest/globals";
import { remember, fetchStateActionSequence } from "../../src/collectiveMemory";
import { objectiveStateExample1 } from "../../src/collectiveMemory/examples";

describe("Remember", () => {
  it("should remember", async () => {
    const memories = await remember(objectiveStateExample1, {
      apiKey: process.env.HDR_API_KEY!,
      endpoint: process.env.HDR_ENDPOINT!,
    });
    expect(memories[0].actionStep.command).toStrictEqual([
      { index: 5, kind: "Type", text: "gadget 11 pro price" },
    ]);
  });
});

describe("Fetch state actions sequences", () => {
  it("should fetch state actions sequences", async () => {
    const stateActionPairs = await fetchStateActionSequence(
      "9eaa1d07-1c3d-4e32-867c-f26a8947f1dd",
      {
        apiKey: process.env.HDR_API_KEY!,
        endpoint: "https://api.hdr.is",
      }
    );
    expect(stateActionPairs.length).toBe(5);
  });
});
