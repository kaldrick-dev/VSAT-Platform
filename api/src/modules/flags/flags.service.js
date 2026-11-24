import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../utils/http-error.js";

export const RESPONSE_DAYS = 7;

export const createFlag = async (vendorId, allocationId, data) => {
  const allocation = await prisma.allocation.findUnique({ where: { id: allocationId } });
  if (!allocation) throw new HttpError(404, "not_found", "Allocation not found");
  const dueAt = new Date(Date.now() + RESPONSE_DAYS * 24 * 60 * 60 * 1000);
  return prisma.flag.create({ data: { ...data, allocationId, vendorId, dueAt } });
};

export const listMine = (vendorId) =>
  prisma.flag.findMany({ where: { vendorId }, orderBy: { createdAt: "desc" } });

export const listAll = (filters) =>
  prisma.flag.findMany({
    where: filters,
    include: {
      vendor: { select: { fullName: true, email: true } },
      allocation: { select: { site: { select: { name: true } } } }
    },
    orderBy: { createdAt: "desc" }
  });

export const reviewFlag = async (id, { status, reviewNote }) => {
  const flag = await prisma.flag.findUnique({ where: { id } });
  if (!flag) throw new HttpError(404, "not_found", "Flag not found");
  if (flag.status !== "open") throw new HttpError(409, "already_reviewed", "This flag was already reviewed");

  const [updated] = await prisma.$transaction([
    prisma.flag.update({ where: { id }, data: { status, reviewNote, reviewedAt: new Date() } }),
    prisma.notification.create({
      data: { userId: flag.vendorId, title: `Flag ${status}`, body: `Your flag was ${status}. ${reviewNote}` }
    })
  ]);
  return updated;
};
