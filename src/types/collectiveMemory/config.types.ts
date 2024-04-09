import { z } from "zod";

export const CollectiveMemoryConfig = z.object({
  endpoint: z.string().url().default("https://api.hdr.is"),
  apiKey: z
    .string()
    .optional()
    .default(() => process.env.HDR_API_KEY!),
});

export type CollectiveMemoryConfig = z.infer<typeof CollectiveMemoryConfig>;
