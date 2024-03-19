import { jsonSchemaToZod } from "json-schema-to-zod";
import { z } from "zod";
import * as fs from "fs";

export async function jsonToZod(jsonObject: any): Promise<any> {
  const _module = jsonSchemaToZod(jsonObject, { module: "cjs" });

  // this is very dangerous and we need to be careful
  const a = eval(_module);

  return a;
}
