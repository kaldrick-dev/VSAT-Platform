import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { idSchema } from "./notifications.schemas.js";
import * as notificationsService from "./notifications.service.js";

export const notificationsRoutes = Router();

notificationsRoutes.use(requireAuth);

notificationsRoutes.get("/", async (req, res) => {
  res.json(await notificationsService.listNotifications(req.user.sub));
});

notificationsRoutes.post("/read-all", async (req, res) => {
  await notificationsService.markAllRead(req.user.sub);
  res.status(204).end();
});

notificationsRoutes.patch("/:id/read", validate({ params: idSchema }), async (req, res) => {
  res.json({ data: await notificationsService.markRead(req.user.sub, req.params.id) });
});
