import { describe, expect, it } from "@jest/globals";
import { compareCommand } from "../../src/agent/agent";
import { BrowserActionSchemaArray } from "../../src/types";

import { generateCommandSchema } from "../../src/agent/schemaGenerators";

describe("generate Schemas", () => {
  it("it should return the schema", () => {
    const sampleSchema = [
      {
        kind: "Type",
        index: 1,
        text: "test",
      },
    ];

    const commandArray = BrowserActionSchemaArray.parse(sampleSchema);

    const schema = generateCommandSchema(commandArray);
    expect(schema.safeParse(sampleSchema).success).toBe(true);
    expect(schema.parse(sampleSchema)).toBeDefined();
  });

  it("should throw an error if the schema is not correct", () => {
    const sampleSchema = [
      {
        kind: "Type",
        index: 1,
        text: "test",
      },
    ];
    const schema = generateCommandSchema(
      sampleSchema as BrowserActionSchemaArray
    );

    const f = schema.safeParse([{ kind: "Click", index: 2 }]);

    expect(f.success).toBe(false);
    expect(() => schema.parse([{ kind: "Click", index: 2 }])).toThrow();
  });

  it("Should parse many commands", () => {
    const sampleSchema = [
      {
        kind: "Type",
        index: 1,
        text: "test",
      },
      {
        kind: "Click",
        index: 2,
      },
      {
        kind: "Type",
        index: 3,
        text: "test",
      },
    ];

    const schema = generateCommandSchema(
      sampleSchema as BrowserActionSchemaArray
    );

    const newCommand = [
      {
        kind: "Type",
        index: 3,
        text: "THIS IS A TEST",
      },
      {
        kind: "Click",
        index: 5,
      },
      {
        kind: "Type",
        index: 10,
        text: "WOW WHAT A CHANGE OF INDEX",
      },
    ];
    const newCommandParsed = schema.parse(newCommand);
    expect(schema.safeParse(sampleSchema).success).toBe(true);
    expect(newCommandParsed[0].kind).toBe("Type");
    expect(newCommandParsed[0].index).toBe(3);
    expect(newCommandParsed[0].text).toBe("THIS IS A TEST");
    expect(newCommandParsed[1].kind).toBe("Click");
    expect(newCommandParsed[1].index).toBe(5);
    expect(newCommandParsed[2].kind).toBe("Type");
    expect(newCommandParsed[2].index).toBe(10);
    expect(newCommandParsed[2].text).toBe("WOW WHAT A CHANGE OF INDEX");
  });

  it("Should throw an error if the command is out of order", () => {
    const sampleSchema = [
      {
        kind: "Type",
        index: 1,
        text: "test",
      },
      {
        kind: "Click",
        index: 2,
      },
      {
        kind: "Type",
        index: 3,
        text: "test",
      },
    ];

    const schema = generateCommandSchema(
      sampleSchema as BrowserActionSchemaArray
    );

    const newCommand = [
      {
        kind: "Type",
        index: 3,
        text: "THIS IS A TEST",
      },
      {
        kind: "Wait",
      },
      {
        kind: "Type",
        index: 2,
        text: "WOW WHAT A CHANGE OF INDEX",
      },
    ];

    const f = schema.safeParse(newCommand);
    expect(f.success).toBe(false);
  });
});
