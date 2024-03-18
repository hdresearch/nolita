import { jsonSchemaToZod } from "json-schema-to-zod";
import { z } from "zod";
import * as fs from "fs";

export async function jsonToZod(jsonObject): Promise<any> {
  const _module = jsonSchemaToZod(jsonObject, { module: "cjs" });
  console.log("module", _module);

  // this is very dangerous and we need to be careful
  const a = eval(_module);

  return a;
}
