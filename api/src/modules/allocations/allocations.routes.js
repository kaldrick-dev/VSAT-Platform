import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { listAllocationsSchema, revokeSchema, siteIdSchema } from "./allocations.schemas.js";
import * as allocationsService from "./allocations.service.js";

export const allocationsRoutes = Router();

allocationsRoutes.get("/allocations", requireAuth, requireRole("admin", "vendor"), validate({ query: listAllocationsSchema }), async (req, res) => {
  res.json({ data: await allocationsService.listAllocations(req.user, req.query) });
});

allocationsRoutes.post("/sites/:siteId/revoke", requireAuth, requireRole("admin"), validate({ params: siteIdSchema, body: revokeSchema }), async (req, res) => {
  res.status(201).json({ data: await allocationsService.revokeSite(req.user.sub, req.params.siteId, req.body) });
});
