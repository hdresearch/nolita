import { z } from "zod";

const InventorySchema = z.record(z.string(), z.string());
