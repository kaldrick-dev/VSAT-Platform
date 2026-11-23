import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./applications.controller.js";
import { applySchema, siteIdSchema } from "./applications.schemas.js";

export const applicationsRoutes = Router();

applicationsRoutes.post("/sites/:siteId/applications", requireAuth, requireRole("vendor"), validate({ params: siteIdSchema, body: applySchema }), controller.apply);
applicationsRoutes.get("/applications/me", requireAuth, requireRole("vendor"), controller.listMine);
