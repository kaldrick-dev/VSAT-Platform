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

export const REASON_CATEGORIES = ["queue_order", "documents", "eligibility", "site_terms", "other"];

export const decisionSchema = z
  .object({
    outcome: z.enum(["approved", "rejected"]),
    reason: z.string().min(3),
    reasonCategory: z.enum(REASON_CATEGORIES).default("other"),
    outOfOrder: z.boolean().default(false)
  })
  .refine((body) => !body.outOfOrder || body.reason.trim().length >= 20, {
    path: ["reason"],
    message: "An out-of-order decision needs a reason of at least 20 characters"
  });
