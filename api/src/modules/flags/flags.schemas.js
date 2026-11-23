import { z } from "zod";

export const idSchema = z.object({ id: z.string().min(1) });
export const allocationIdSchema = z.object({ allocationId: z.string().min(1) });

export const createFlagSchema = z.object({
  category: z.string().min(1),
  note: z.string().min(5)
});

export const listFlagsSchema = z.object({
  status: z.enum(["open", "upheld", "dismissed"]).optional()
});

export const reviewFlagSchema = z.object({
  status: z.enum(["upheld", "dismissed"]),
  reviewNote: z.string().min(3)
});
