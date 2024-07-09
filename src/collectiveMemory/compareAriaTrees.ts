import { ObjectiveState } from "../types/browser";

export function parseAriaTree(array: any[]): any[] {
  function findLeafArrays(arr: any[]): any[] {
    // Collect leaf arrays
    const leafArrays: any[] = [];

    arr.forEach((item) => {
      // If the item is an array, we should check its contents
      if (Array.isArray(item)) {
        // Check if it contains any child arrays
        const hasChildArrays = item.some(Array.isArray);
        // If no child arrays, it's a leaf array
        if (!hasChildArrays) {
          leafArrays.push(item);
        } else {
          if (item[1] === "combobox") {
            leafArrays.push(item.slice(0, 3));
          }
          // Otherwise, recursively find leaf arrays within the children
          leafArrays.push(...findLeafArrays(item));
        }
      }
    });

    return leafArrays;
  }

  return findLeafArrays(array);
}

export function updateCommandIndices(
  objectiveStateOld: ObjectiveState,
  objectiveStateNew: ObjectiveState,
  commands: any[]
) {
  const oldAriaTree = parseAriaTree(JSON.parse(objectiveStateOld.ariaTree));
  const newAriaTree = parseAriaTree(JSON.parse(objectiveStateNew.ariaTree));

  const getKey = (item: any[]) => JSON.stringify(item.slice(1));

  const newMap = new Map();
  newAriaTree.forEach((oldItem) => {
    if (oldItem.length !== 3) return;
    const oldKey = getKey(oldItem);
    newMap.set(oldKey, oldItem);
  });
  const oldMap = new Map();
  oldAriaTree.forEach((oldItem) => {
    if (oldItem.length > 3) {
      oldMap.set(oldItem[0], oldItem.slice(0, 3));
    }
    oldMap.set(oldItem[0], oldItem);
  });

  const updatedCommands: any[] = [];
  commands.forEach((command) => {
    if (command.index === undefined) {
      updatedCommands.push(command);
    }
    const oldcommandObject = oldMap.get(command.index);
    const newcommandObject = newMap.get(getKey(oldcommandObject));
    if (oldcommandObject === newcommandObject) {
      updatedCommands.push(command);
    }

    const updatedCommand = { ...command, index: newcommandObject[0] };

    updatedCommands.push(updatedCommand);
  });

  return updatedCommands;
}
