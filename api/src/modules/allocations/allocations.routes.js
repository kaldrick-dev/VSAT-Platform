import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { listAllocationsSchema } from "./allocations.schemas.js";
import * as allocationsService from "./allocations.service.js";

export const allocationsRoutes = Router();

allocationsRoutes.get("/allocations", requireAuth, requireRole("admin", "vendor"), validate({ query: listAllocationsSchema }), async (req, res) => {
  res.json({ data: await allocationsService.listAllocations(req.user, req.query) });
});
