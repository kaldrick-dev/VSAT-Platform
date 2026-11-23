import { z } from "zod";

export const siteIdSchema = z.object({ siteId: z.string().min(1) });

export const applySchema = z.object({
  statement: z.string().max(1000).optional()
});
