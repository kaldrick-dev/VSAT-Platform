import { z } from "zod";

export const listAllocationsSchema = z.object({
  siteId: z.string().optional(),
  outcome: z.enum(["approved", "rejected", "revoked"]).optional()
});
