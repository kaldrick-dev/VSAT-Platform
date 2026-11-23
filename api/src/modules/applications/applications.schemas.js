import { z } from "zod";

export const siteIdSchema = z.object({ siteId: z.string().min(1) });

export const applySchema = z.object({
  statement: z.string().max(1000).optional()
});

export const idSchema = z.object({ id: z.string().min(1) });

export const listAllSchema = z.object({
  siteId: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected", "withdrawn"]).optional()
});

export const decisionSchema = z.object({
  outcome: z.enum(["approved", "rejected"]),
  reason: z.string().min(3)
});
