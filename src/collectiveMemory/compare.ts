import { ObjectiveState } from "../types/browser";
import { BrowserAction } from "../types/browser/actions.types";
import { AccessibilityTree } from "../types/browser/browser.types";
import { Memory } from "../types/memory.types";

type NestedArray<T> = Array<T | NestedArray<T>>;

export function extractTerminalArrays<T>(arr: NestedArray<T>): T[][] {
  const terminalArrays: T[][] = [];

  function traverse(currentArr: NestedArray<T>) {
    for (const item of currentArr) {
      if (Array.isArray(item)) {
        if (item.every((subItem) => !Array.isArray(subItem))) {
          terminalArrays.push(item as T[]);
        } else {
          traverse(item as NestedArray<T>);
        }
      }
    }
  }

  traverse(arr);
  return terminalArrays;
}

export function compareMemories(
  command: BrowserAction,
  currentState: ObjectiveState,
  memory: Memory
): boolean {
  return false;
}

function arrayDiff<T>(arr1: T[], arr2: T[]): T[] {
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);

  const diff: T[] = [];

  for (const item of set1) {
    if (!set2.has(item)) {
      diff.push(item);
    }
  }

  for (const item of set2) {
    if (!set1.has(item)) {
      diff.push(item);
    }
  }

  return diff;
}

export function diffMemory(currentState: ObjectiveState, memory: Memory) {
  if (!memory || !currentState) {
    return { memoryTreeMap: [], currentTreeMap: [], diff: [] };
  }

  const memoryTreeMap = extractTerminalArrays(
    JSON.parse(memory.objectiveState.ariaTree)
  );
  const currentTreeMap = extractTerminalArrays(
    JSON.parse(currentState.ariaTree)
  );

  const diff = arrayDiff(memoryTreeMap, currentTreeMap);

  return { memoryTreeMap, currentTreeMap, diff };
}
