import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { allocationsRoutes } from "../modules/allocations/allocations.routes.js";
import { applicationsRoutes } from "../modules/applications/applications.routes.js";
import { documentsRoutes } from "../modules/documents/documents.routes.js";
import { profileRoutes } from "../modules/profile/profile.routes.js";
import { sitesRoutes } from "../modules/sites/sites.routes.js";
import { healthRoutes } from "../modules/health/health.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRoutes);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/sites", sitesRoutes);
apiRouter.use(applicationsRoutes);
apiRouter.use("/profile", profileRoutes);
apiRouter.use(documentsRoutes);
apiRouter.use(allocationsRoutes);

apiRouter.get("/dashboard/outcomes", (_req, res) => {
  res.json({ data: [], meta: { filters: {} } });
});

apiRouter.get("/flags", (_req, res) => {
  res.json({ data: [], meta: { total: 0 } });
});

apiRouter.post("/allocations/:allocationId/flags", requireAuth, requireRole("vendor"), (_req, res) => {
  res.status(501).json({ message: "Allocation flag endpoint scaffolded" });
});

