import { maskString, maskNumber } from "./helpers";

export type InventoryValue = {
  name: string;
  value: any;
  type: number | string;
};

export class Inventory {
  private inventory: InventoryValue[] = [];
  maskedInventory: InventoryValue[] = [];

  constructor(inventory: InventoryValue[]) {
    this.inventory = inventory;
    this.maskedInventory = inventory.map((item) => {
      return {
        name: item.name,
        value: this.maskValue(item.value, item.type),
        type: item.type,
      };
    });
  }

  toString(): string {
    const inventoryArray = this.maskedInventory.map((item) => {
      return `${item.name}: ${item.value}`;
    });

    return inventoryArray.join(", ");
  }

  private maskValue(value: any, type: number | string) {
    if (type === "string") {
      return maskString(value);
    } else if (type === "number") {
      return maskNumber(value);
    }
  }

  replaceMask(value: any) {
    const found = this.maskedInventory.find((item) => item.value === value);
    if (found) {
      return this.inventory.find((item) => item.name === found.name)?.value;
    }
    return value;
  }
}
