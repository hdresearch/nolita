import { describe, expect, it } from "@jest/globals";
import {
  parseAriaTree,
  updateCommandIndices,
} from "../../src/collectiveMemory/compareAriaTrees";
import { objectiveStateExample1 } from "./memorize.test";

describe("extractTerminalArrays", () => {
  it("should extract all terminal arrays from the ariaTree", () => {
    const treeArray = JSON.parse(objectiveStateExample1.ariaTree);
    const expectedTerminalArrays = [
      [1, "link", "Gmail"],
      [2, "link", "Images"],
      [3, "button", "Google apps"],
      [4, "link", "Sign in"],
      ["img", "Google"],
      [5, "combobox", "Search"],
    ];
    const result = parseAriaTree(treeArray);

    expect(result).toEqual(expectedTerminalArrays);
  });

  it("should return an empty array if there are no terminal arrays", () => {
    const treeArray = [0, "RootWebArea", "Google", []];
    const expectedTerminalArrays = [[]];
    const result = parseAriaTree(treeArray);

    expect(result).toEqual(expectedTerminalArrays);
  });
});

describe("updateCommandIndices", () => {
  it("should update the indices of the command", () => {
    const objectiveStateNew = {
      ...objectiveStateExample1,
      ariaTree: `[0,"RootWebArea","Google",[[1,"link","Gmail"],[2,"link","Images"],[3,"button","Google apps"],[4,"link","Sign in"],["img","Google"],[7,"combobox","Search"],[6,"link","Maps"]]]`,
    };

    const objectiveStateOld = objectiveStateExample1;

    const commands = [
      {
        kind: "Click",
        index: 1,
      },
      {
        kind: "Type",
        index: 5,
        text: "gadget 11 pro price",
      },
    ];

    const expectedCommands = [
      {
        kind: "Click",
        index: 1,
      },
      {
        kind: "Type",
        index: 7,
        text: "gadget 11 pro price",
      },
    ];

    const res = updateCommandIndices(
      objectiveStateOld,
      objectiveStateNew,
      commands,
    );

    expect(res).toStrictEqual(expectedCommands);
  });
});
