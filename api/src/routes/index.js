import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { healthRoutes } from "../modules/health/health.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRoutes);
apiRouter.use("/auth", authRoutes);

apiRouter.get("/sites", (_req, res) => {
  res.json({ data: [], meta: { total: 0 } });
});

apiRouter.post("/sites", requireAuth, requireRole("admin"), (_req, res) => {
  res.status(501).json({ message: "Site creation endpoint scaffolded" });
});

apiRouter.post("/sites/:siteId/applications", requireAuth, requireRole("vendor"), (_req, res) => {
  res.status(501).json({ message: "Application submission endpoint scaffolded" });
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

