import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../utils/http-error.js";

export const listNotifications = async (userId) => {
  const data = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return { data, unread: data.filter((n) => !n.read).length };
};

export const markRead = async (userId, id) => {
  const found = await prisma.notification.findFirst({ where: { id, userId } });
  if (!found) throw new HttpError(404, "not_found", "Notification not found");
  return prisma.notification.update({ where: { id }, data: { read: true } });
};

export const markAllRead = (userId) =>
  prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
