import { prisma } from "../../lib/prisma.js";

const select = { id: true, fullName: true, email: true, role: true, trade: true, phone: true };

export const getProfile = (id) => prisma.user.findUnique({ where: { id }, select });

export const updateProfile = (id, data) => prisma.user.update({ where: { id }, data, select });
