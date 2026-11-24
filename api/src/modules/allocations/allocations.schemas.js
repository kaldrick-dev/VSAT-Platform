import { z } from "zod";

export const siteIdSchema = z.object({ siteId: z.string().min(1) });

export const REVOKE_CATEGORIES = ["violation", "not_used", "error", "other"];

export const revokeSchema = z.object({
  reason: z.string().trim().min(20, "Give a reason of at least 20 characters"),
  reasonCategory: z.enum(REVOKE_CATEGORIES).default("other")
});

export const listAllocationsSchema = z.object({
  siteId: z.string().optional(),
  outcome: z.enum(["approved", "rejected", "revoked"]).optional()
});
