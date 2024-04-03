import { describe, expect, it } from "@jest/globals";
import { remember } from "../../src/collectiveMemory/remember";
import { objectiveStateExample1 } from "./memorize.test";

describe("Remember -- local", () => {
  it("should remember", async () => {
    const memories = await remember(
      objectiveStateExample1,
      {
        endpoint: process.env.HDR_API_ENDPOINT!,
        apiKey: process.env.HDR_API_KEY!,
      },
      2,
      "http://localhost:8080"
    );
    expect(memories[0].actionStep.command).toStrictEqual([
      { index: 5, kind: "Type", text: "gadget 11 pro price" },
    ]);
  });
});
