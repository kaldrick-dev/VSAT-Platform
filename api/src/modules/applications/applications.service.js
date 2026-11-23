import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../utils/http-error.js";

const queuePosition = (application) =>
  prisma.application.count({
    where: { siteId: application.siteId, status: "pending", appliedAt: { lte: application.appliedAt } }
  });

export const apply = async (vendorId, siteId, { statement }) => {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) throw new HttpError(404, "not_found", "Site not found");
  if (site.status !== "available") throw new HttpError(409, "site_unavailable", "This site is not open for applications");

  const existing = await prisma.application.findUnique({ where: { siteId_vendorId: { siteId, vendorId } } });
  if (existing) throw new HttpError(409, "already_applied", "You already applied to this site");

  const application = await prisma.application.create({ data: { siteId, vendorId, statement } });
  return { ...application, queuePosition: await queuePosition(application) };
};

export const listMine = async (vendorId) => {
  const applications = await prisma.application.findMany({
    where: { vendorId },
    include: { site: { select: { name: true, reference: true, district: true } } },
    orderBy: { appliedAt: "desc" }
  });

  return Promise.all(
    applications.map(async (application) => ({
      ...application,
      queuePosition: application.status === "pending" ? await queuePosition(application) : null
    }))
  );
};

export const listAll = (filters) =>
  prisma.application.findMany({
    where: filters,
    include: {
      site: { select: { name: true, reference: true } },
      vendor: { select: { fullName: true, email: true } }
    },
    orderBy: { appliedAt: "asc" }
  });

export const decide = async (adminId, id, { outcome, reason }) => {
  const application = await prisma.application.findUnique({ where: { id }, include: { site: true } });
  if (!application) throw new HttpError(404, "not_found", "Application not found");
  if (application.status !== "pending") throw new HttpError(409, "already_decided", "This application was already decided");

  const [updated] = await prisma.$transaction([
    prisma.application.update({ where: { id }, data: { status: outcome } }),
    prisma.allocation.create({
      data: { siteId: application.siteId, applicationId: id, outcome, reason, decidedById: adminId }
    }),
    prisma.notification.create({
      data: {
        userId: application.vendorId,
        title: `Application ${outcome}`,
        body: `Your application for ${application.site.name} was ${outcome}. Reason: ${reason}`
      }
    }),
    ...(outcome === "approved"
      ? [prisma.site.update({ where: { id: application.siteId }, data: { status: "allocated" } })]
      : [])
  ]);
  return updated;
};
