import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createDocumentSchema, idSchema } from "./documents.schemas.js";
import * as documentsService from "./documents.service.js";

export const documentsRoutes = Router();

documentsRoutes.get("/documents", requireAuth, requireRole("vendor"), async (req, res) => {
  res.json({ data: await documentsService.listDocuments(req.user.sub) });
});

documentsRoutes.post("/documents", requireAuth, requireRole("vendor"), validate({ body: createDocumentSchema }), async (req, res) => {
  res.status(201).json({ data: await documentsService.createDocument(req.user.sub, req.body) });
});

documentsRoutes.delete("/documents/:id", requireAuth, requireRole("vendor"), validate({ params: idSchema }), async (req, res) => {
  await documentsService.deleteDocument(req.user.sub, req.params.id);
  res.status(204).end();
});

documentsRoutes.get("/vendors/:id/documents", requireAuth, requireRole("admin"), validate({ params: idSchema }), async (req, res) => {
  res.json({ data: await documentsService.listDocuments(req.params.id) });
});
