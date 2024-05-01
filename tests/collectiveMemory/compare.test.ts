import { describe, expect, it } from "@jest/globals";
import {
  diffMemory,
  extractTerminalArrays,
} from "../../src/collectiveMemory/compare";
import { stateActionPair1 } from "../../src/collectiveMemory/examples";

describe("Compare memories to current state", () => {
  it("should compare memories to current state", () => {
    const result = diffMemory(
      stateActionPair1.objectiveState,
      stateActionPair1
    );

    expect(result).toBe(true);
  });
});

describe("Extract teriminal arrays", () => {
  it("should extract terminal arrays", () => {
    const result = extractTerminalArrays([1, 2, [3, 4], [5, [6, 7]]]);
    const want = [
      [3, 4],
      [6, 7],
    ];
    expect(result).toEqual(want);
  });

  it("should extract terminal arrays from aria tree", () => {
    const ariaTree: any[] = [
      0,
      "RootWebArea",
      "Google",
      [
        [1, "link", "Gmail"],
        [2, "link", "Images"],
        [3, "button", "Google apps"],
        [4, "link", "Sign in"],
        ["img", "Google"],
        [5, "combobox", "Search"],
        [6, "link", "Advanced search - time"],
        [7, "link", "Advanced search - region"],
      ],
    ];
    const result = extractTerminalArrays(ariaTree);
    const want = [
      [1, "link", "Gmail"],
      [2, "link", "Images"],
      [3, "button", "Google apps"],
      [4, "link", "Sign in"],
      ["img", "Google"],
      [5, "combobox", "Search"],
      [6, "link", "Advanced search - time"],
      [7, "link", "Advanced search - region"],
    ];
    console.log("flat tree:", result);
    expect(result).toEqual(want);
  });
});

describe("Diff memory", () => {
  it("should diff memory", () => {
    const result = diffMemory(
      stateActionPair1.objectiveState,
      stateActionPair1
    );

    console.log("Diff result:", result);

    expect(result.diff.length).toBe(0);
  });
});
