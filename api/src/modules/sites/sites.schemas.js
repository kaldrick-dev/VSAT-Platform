import { z } from "zod";

const status = z.enum(["available", "allocated", "inactive"]);

export const listSitesSchema = z.object({
  district: z.string().optional(),
  type: z.string().optional(),
  status: status.optional()
});

export const idSchema = z.object({ id: z.string().min(1) });

export const createSiteSchema = z.object({
  reference: z.string().min(1).optional(),
  name: z.string().min(2),
  district: z.string().min(1),
  sector: z.string().min(1),
  type: z.string().min(1),
  size: z.string().min(1),
  fee: z.number().int().min(0),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  terms: z.string().min(1),
  status: status.optional()
});

export const updateSiteSchema = createSiteSchema.partial();
