import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "vsat-api" });
});

apiRouter.post("/auth/register", (_req, res) => {
  res.status(501).json({ message: "Vendor registration endpoint scaffolded" });
});

apiRouter.post("/auth/login", (_req, res) => {
  res.status(501).json({ message: "Login endpoint scaffolded" });
});

apiRouter.get("/sites", (_req, res) => {
  res.json({ data: [], meta: { total: 0 } });
});

apiRouter.post("/sites", requireAuth, requireRole("admin"), (_req, res) => {
  res.status(501).json({ message: "Site creation endpoint scaffolded" });
});

apiRouter.post("/sites/:siteId/applications", requireAuth, requireRole("vendor"), (_req, res) => {
  res.status(501).json({ message: "Application submission endpoint scaffolded" });
});

apiRouter.get("/auth/me", requireAuth, (req, res) => {
  res.json({ data: { id: req.user.sub, role: req.user.role } });
});

// Admin queue view: pending applications per site, oldest first, with vendor identity.
apiRouter.get("/applications", requireAuth, requireRole("admin"), (_req, res) => {
  res.json({ data: [], meta: { total: 0 } });
});

apiRouter.get("/applications/me", requireAuth, requireRole("vendor"), (_req, res) => {
  res.json({ data: [] });
});

apiRouter.post("/allocations", requireAuth, requireRole("admin"), (_req, res) => {
  res.status(501).json({ message: "Allocation decision endpoint scaffolded" });
});

apiRouter.get("/allocations", (_req, res) => {
  res.json({ data: [], meta: { total: 0 } });
});

apiRouter.get("/dashboard/outcomes", (_req, res) => {
  res.json({ data: [], meta: { filters: {} } });
});

apiRouter.get("/flags", (_req, res) => {
  res.json({ data: [], meta: { total: 0 } });
});

apiRouter.post("/allocations/:allocationId/flags", requireAuth, requireRole("vendor"), (_req, res) => {
  res.status(501).json({ message: "Allocation flag endpoint scaffolded" });
});

