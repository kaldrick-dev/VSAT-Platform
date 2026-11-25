import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { allocationIdSchema, createFlagSchema, idSchema, listFlagsSchema, reviewFlagSchema } from "./flags.schemas.js";
import * as flagsService from "./flags.service.js";

export const flagsRoutes = Router();

flagsRoutes.post("/allocations/:allocationId/flags", requireAuth, requireRole("vendor", "association"), validate({ params: allocationIdSchema, body: createFlagSchema }), async (req, res) => {
  res.status(201).json({ data: await flagsService.createFlag(req.user.sub, req.params.allocationId, req.body) });
});

flagsRoutes.get("/flags/me", requireAuth, requireRole("vendor", "association"), async (req, res) => {
  res.json({ data: await flagsService.listMine(req.user.sub) });
});

flagsRoutes.get("/flags", requireAuth, requireRole("admin"), validate({ query: listFlagsSchema }), async (req, res) => {
  res.json({ data: await flagsService.listAll(req.query) });
});

flagsRoutes.patch("/flags/:id", requireAuth, requireRole("admin"), validate({ params: idSchema, body: reviewFlagSchema }), async (req, res) => {
  res.json({ data: await flagsService.reviewFlag(req.params.id, req.body) });
});
