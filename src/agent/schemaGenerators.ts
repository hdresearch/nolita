import { z } from "zod";
export interface SchemaElement {
  kind: string;
  index: number;
  text?: string;
}

export const generateSchema = (sampleSchema: SchemaElement[]) => {
  const schemaElements = sampleSchema.map((element) => {
    const baseSchema: any = {
      kind: z.literal(element.kind),
    };

    if ("index" in element) {
      baseSchema.index = z.number();
    }

    if ("text" in element) {
      baseSchema.text = z.string();
    }

    return baseSchema;
  });

  return z.tuple([
    z.object(schemaElements[0]),
    ...schemaElements.slice(1).map((element) => z.object(element)),
  ]);
};
