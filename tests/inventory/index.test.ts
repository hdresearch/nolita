import { describe, expect, it } from "@jest/globals";
import { Inventory, InventoryValue } from "../../src/inventory/index";

describe("Inventory", () => {
  it("should mask values", () => {
    const inventory: InventoryValue[] = [
      { name: "password", value: "password", type: "string" },
      { name: "age", value: 123, type: "number" },
    ];
    const inv = new Inventory(inventory);
    expect(inv.maskedInventory[0].value).not.toEqual("password");
    expect(inv.maskedInventory[0].value.length).toEqual(8);
    expect(inv.maskedInventory[1].value).toBeGreaterThanOrEqual(100);
    expect(inv.maskedInventory[1].value).toBeLessThanOrEqual(999);
  });

  it("should replace mask", () => {
    const inventory: InventoryValue[] = [
      { name: "password", value: "password", type: "string" },
      { name: "age", value: 123, type: "number" },
    ];
    const inv = new Inventory(inventory);
    expect(inv.replaceMask(inv.maskedInventory[0].value)).toEqual("password");
    expect(inv.replaceMask(inv.maskedInventory[1].value)).toEqual(123);
  });

  it("should censor", () => {
    const inventory: InventoryValue[] = [
      { name: "age", value: 123, type: "number" },
      { name: "password", value: "aSuperStrongPassword", type: "string" },
    ];
    const inv = new Inventory(inventory);
    const str = "the password is aSuperStrongPassword and the age is 123";
    const got = inv.censor(str);
    console.log(got);
    expect(got).not.toEqual("the password is password and the age is 123");
  });
});
