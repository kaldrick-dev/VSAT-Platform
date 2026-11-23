import { z } from "zod";

export const formatSchema = z.object({
  format: z.enum(["json", "csv"]).default("json")
});
