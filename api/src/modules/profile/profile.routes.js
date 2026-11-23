import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as profileService from "./profile.service.js";
import { updateProfileSchema } from "./profile.schemas.js";

export const profileRoutes = Router();

profileRoutes.use(requireAuth, requireRole("vendor"));

profileRoutes.get("/", async (req, res) => {
  res.json({ data: await profileService.getProfile(req.user.sub) });
});

profileRoutes.patch("/", validate({ body: updateProfileSchema }), async (req, res) => {
  res.json({ data: await profileService.updateProfile(req.user.sub, req.body) });
});
