import { z } from "zod";

export const idSchema = z.object({ id: z.string().min(1) });

export const KINDS = ["National ID", "Trading licence", "Proof of residence", "Other"];

export const uploadQuerySchema = z.object({
  kind: z.enum(KINDS),
  fileName: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1).max(120).optional()
});
