import { z } from "zod";

export const idSchema = z.object({ id: z.string().min(1) });

export const createDocumentSchema = z.object({
  name: z.string().min(1),
  kind: z.string().min(1),
  url: z.string().url()
});
