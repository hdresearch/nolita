import { jsonSchemaToZod } from "json-schema-to-zod";

export async function jsonToZod(jsonObject: any): Promise<any> {
  const _module = jsonSchemaToZod(jsonObject, { module: "cjs" });

  // this is very dangerous and we need to be careful
  const a = eval(_module);

  return a;
}
