import express, { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { HttpError } from "../../utils/http-error.js";
import { idSchema, uploadQuerySchema } from "./documents.schemas.js";
import * as documentsService from "./documents.service.js";

export const documentsRoutes = Router();

// The file is the raw request body, so no multipart library is needed.
const readFile = (req, res, next) => {
  const parser = express.raw({ type: ["application/pdf", "image/png", "image/jpeg"], limit: documentsService.MAX_BYTES });
  parser(req, res, (error) => {
    if (error?.type === "entity.too.large") return next(new HttpError(413, "file_too_large", "The file is larger than 4 MB"));
    next(error);
  });
};

documentsRoutes.get("/documents", requireAuth, requireRole("vendor"), async (req, res) => {
  res.json({ data: await documentsService.listDocuments(req.user.sub) });
});

documentsRoutes.post("/documents", requireAuth, requireRole("vendor"), readFile, validate({ query: uploadQuerySchema }), async (req, res) => {
  const mimeType = req.headers["content-type"]?.split(";")[0];
  res.status(201).json({ data: await documentsService.createDocument(req.user.sub, req.query, mimeType, req.body) });
});

documentsRoutes.get("/documents/:id/file", requireAuth, requireRole("vendor", "admin"), validate({ params: idSchema }), async (req, res) => {
  const document = await documentsService.getFile(req.user, req.params.id);
  res.set({
    "Content-Type": document.mimeType,
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
    "Cache-Control": "private, no-store"
  });
  res.send(document.data);
});

documentsRoutes.delete("/documents/:id", requireAuth, requireRole("vendor"), validate({ params: idSchema }), async (req, res) => {
  await documentsService.deleteDocument(req.user.sub, req.params.id);
  res.status(204).end();
});

documentsRoutes.get("/vendors/:id/documents", requireAuth, requireRole("admin"), validate({ params: idSchema }), async (req, res) => {
  res.json({ data: await documentsService.listDocuments(req.params.id) });
});
