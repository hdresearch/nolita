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
    const want = new Map<number, any[]>([
      [3, [3, 4]],
      [6, [6, 7]],
    ]);
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
      ],
    ];
    const result = extractTerminalArrays(ariaTree);
    const want = new Map([
      [1, [1, "link", "Gmail"]],
      [2, [2, "link", "Images"]],
      [3, [3, "button", "Google apps"]],
      [4, [4, "link", "Sign in"]],
      [5, [5, "combobox", "Search"]],
      [7, [7, "link", "Advanced search - time"]],
      [8, [8, "link", "Advanced search - region"]],
    ]);
    console.log("flat tree:", result);
    expect(result).toEqual(want);
  });
});
