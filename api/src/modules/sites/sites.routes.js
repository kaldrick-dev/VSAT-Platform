import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./sites.controller.js";
import { createSiteSchema, idSchema, listSitesSchema, updateSiteSchema } from "./sites.schemas.js";

export const sitesRoutes = Router();

sitesRoutes.get("/", validate({ query: listSitesSchema }), controller.list);
sitesRoutes.get("/:id", validate({ params: idSchema }), controller.get);
sitesRoutes.post("/", requireAuth, requireRole("admin"), validate({ body: createSiteSchema }), controller.create);
sitesRoutes.patch("/:id", requireAuth, requireRole("admin"), validate({ params: idSchema, body: updateSiteSchema }), controller.update);
