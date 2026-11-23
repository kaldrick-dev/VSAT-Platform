import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./applications.controller.js";
import { applySchema, decisionSchema, idSchema, listAllSchema, siteIdSchema } from "./applications.schemas.js";

export const applicationsRoutes = Router();

applicationsRoutes.post("/sites/:siteId/applications", requireAuth, requireRole("vendor"), validate({ params: siteIdSchema, body: applySchema }), controller.apply);
applicationsRoutes.get("/applications/me", requireAuth, requireRole("vendor"), controller.listMine);
applicationsRoutes.get("/applications", requireAuth, requireRole("admin"), validate({ query: listAllSchema }), controller.listAll);
applicationsRoutes.patch("/applications/:id", requireAuth, requireRole("admin"), validate({ params: idSchema, body: decisionSchema }), controller.decide);
