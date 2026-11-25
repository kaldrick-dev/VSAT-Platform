import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    accountType: z.enum(["vendor", "association"]).default("vendor"),
    organisation: z.string().trim().min(2).max(120).optional()
  })
  .refine((body) => body.accountType !== "association" || body.organisation, {
    path: ["organisation"],
    message: "Say which organisation you represent"
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
