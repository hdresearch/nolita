import { z } from "zod";

export const CollectiveMemoryConfig = z.object({
  endpoint: z
    .string()
    .url()
    .default(() => process.env.HDR_ENDPOINT || "https://api.hdr.is"),
  apiKey: z
    .string()
    .nullable()
    .default(() => process.env.HDR_API_KEY || null),
});

export type CollectiveMemoryConfig = z.infer<typeof CollectiveMemoryConfig>;
