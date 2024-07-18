import { describe, expect, it } from "@jest/globals";
import { memorize } from "../../src/collectiveMemory/memorize";
import { CollectiveMemoryConfig } from "../../src/types/collectiveMemory/index";
import { ObjectiveState } from "../../src/types/browser";
import { ModelResponseType } from "../../src/types/browser/actionStep.types";
import { generateUUID } from "../../src/utils";

export const objectiveStateExample1: ObjectiveState = {
  kind: "ObjectiveState",
  objective: "how much is an gadget 11 pro",
  progress: [],
  url: "https://www.google.com/",
  ariaTree: `[0,"RootWebArea","Google",[[1,"link","Gmail"],[2,"link","Images"],[3,"button","Google apps"],[4,"link","Sign in"],["img","Google"],[5,"combobox","Search"]]]`,
};

export const actionStepExample1: ModelResponseType = {
  progressAssessment:
    "Do not have enough information in ariaTree to return an Objective Result.",
  command: [
    {
      kind: "Type",
      index: 5,
      text: "gadget 11 pro price",
    },
  ],
  description: "Searched `gadget 11 pro price`",
};

describe("Memorize", () => {
  const cmConfig = CollectiveMemoryConfig.parse({
    endpoint: "https://api.hdr.is",
  });
  it("should memorize", async () => {
    const memory = await memorize(
      objectiveStateExample1,
      actionStepExample1,
      generateUUID(),
      cmConfig,
    );

    expect(memory).toBe(true);
  });

  it("should memorize if no api key", async () => {
    const cmConfig = CollectiveMemoryConfig.parse({
      endpoint: "https://api.hdr.is",
    });
    const memory = await memorize(
      objectiveStateExample1,
      actionStepExample1,
      generateUUID(),
      cmConfig,
    );

    expect(memory).toBe(true);
  });
});
