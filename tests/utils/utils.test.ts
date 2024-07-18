import { test, expect } from "@jest/globals";
import { generateUUID } from "../../src/utils/uuid";

test("generateUUID", () => {
  const uuid = generateUUID();
  expect(uuid).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  );
});
