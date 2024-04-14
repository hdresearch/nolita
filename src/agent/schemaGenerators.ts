import { z } from "zod";
import {
  BrowserActionSchemaArray,
  Click,
  Type,
  Back,
  Wait,
} from "../types/browser/actionStep.types";

/*
This function generates a zod schema from past browser actions
*/
export function generateCommandSchema(sample: BrowserActionSchemaArray) {
  const schemaArray: Array<z.ZodTypeAny> = [];

  sample.forEach((action) => {
    if (action.kind === "Click") {
      schemaArray.push(Click);
    } else if (action.kind === "Type") {
      schemaArray.push(Type);
    } else if (action.kind === "Back") {
      schemaArray.push(Back);
    } else if (action.kind === "Wait") {
      schemaArray.push(Wait);
    }
  });
  return z.tuple(schemaArray as [z.ZodTypeAny, ...z.ZodTypeAny[]]);
}
