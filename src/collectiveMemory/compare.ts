import { ObjectiveState } from "../types/browser";
import { BrowserAction } from "../types/browser/actions.types";
import { Memory } from "../types/memory.types";

export function extractTerminalArrays(arr: any[]): Map<number, any[]> {
  const terminalArrays = new Map<number, any[]>();
  const stack: any[][] = [arr];

  while (stack.length > 0) {
    const currentArr = stack.pop();

    if (currentArr) {
      for (let i = 0; i < currentArr.length; i++) {
        const element = currentArr[i];
        if (Array.isArray(element)) {
          if (element.every((item: any) => !Array.isArray(item))) {
            console.log("element", typeof element[0]);
            if (typeof element[0] === "number") {
              terminalArrays.set(element[0], element);
            }
          } else {
            if (typeof element[0] === "number") {
              stack.push(element);
            }
          }
        }
      }
    }
  }

  return terminalArrays;
}

export function compareMemories(
  command: BrowserAction,
  currentState: ObjectiveState,
  memory: Memory
): boolean {
  return false;
}

export function diffMemory(
  currentState: ObjectiveState,
  memory: Memory
): boolean {
  if (!memory || !currentState) {
    return false;
  }

  const { actionStep, objectiveState } = memory;

  const memoryTreeMap = extractTerminalArrays(
    JSON.parse(memory.objectiveState.ariaTree)
  );
  const currentTreeMap = extractTerminalArrays(
    JSON.parse(currentState.ariaTree)
  );

  console.log("memoryTree", memoryTreeMap);
  console.log("currentTree", currentTreeMap);

  return false;
}
