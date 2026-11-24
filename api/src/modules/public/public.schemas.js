import { z } from "zod";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const formatSchema = z.object({
  format: z.enum(["json", "csv"]).optional(),
  from: day.optional(),
  to: day.optional()
});

export const summarySchema = z.object({ from: day.optional(), to: day.optional() });
