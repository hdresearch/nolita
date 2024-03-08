import { describe, expect, it } from "@jest/globals";
import { maskNumber, maskString } from "../../src/inventory/helpers";

describe("maskString", () => {
  it("should mask a string", () => {
    const result = maskString("password");
    console.log(result);
    expect(result).not.toEqual("password");
    expect(result.length).toEqual(8);
    result.split("").forEach((char) => {
      expect(char).toMatch(/[a-zA-Z0-9]/);
    });
  });
});

describe("maskNumber", () => {
  it("should mask a number", () => {
    const result = maskNumber(123456);
    console.log(result);
    expect(result).toBeGreaterThanOrEqual(100000);
    expect(result).toBeLessThanOrEqual(999999);
  });
});
