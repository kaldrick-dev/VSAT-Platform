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
