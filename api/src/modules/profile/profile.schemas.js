import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  trade: z.string().min(1).optional(),
  phone: z.string().min(5).optional()
});
