import { z } from "zod";

export const CollectiveMemoryConfigSchema = z.object({
  endpoint: z.string().url().default("http://api.hdr.is/memory/memorize"),
  apiKey: z.string().optional(),
});

export type CollectiveMemoryConfig = z.infer<
  typeof CollectiveMemoryConfigSchema
>;
