import { describe, expect, it } from "@jest/globals";
import { remember } from "../../src/collectiveMemory";
import { objectiveStateExample1 } from "../../src/collectiveMemory/examples";

describe("Remember -- local", () => {
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
