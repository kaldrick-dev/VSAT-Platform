import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../utils/http-error.js";

const queuePosition = (application, db = prisma) =>
  db.application.count({
    where: { siteId: application.siteId, status: "pending", appliedAt: { lte: application.appliedAt } }
  });

export const apply = async (vendorId, siteId, { statement }) => {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) throw new HttpError(404, "not_found", "Site not found");
  if (site.status !== "available") throw new HttpError(409, "site_unavailable", "This site is not open for applications");

  const existing = await prisma.application.findUnique({ where: { siteId_vendorId: { siteId, vendorId } } });
  if (existing && existing.status !== "withdrawn") throw new HttpError(409, "already_applied", "You already applied to this site");

  // Applying again after a withdrawal starts a new place at the back of the queue.
  const application = existing
    ? await prisma.application.update({ where: { id: existing.id }, data: { status: "pending", statement, appliedAt: new Date() } })
    : await prisma.application.create({ data: { siteId, vendorId, statement } });
  return { ...application, queuePosition: await queuePosition(application) };
};

export const withdraw = async (vendorId, id) => {
  const application = await prisma.application.findUnique({ where: { id } });
  if (!application || application.vendorId !== vendorId) throw new HttpError(404, "not_found", "Application not found");
  if (application.status !== "pending") throw new HttpError(409, "not_pending", "Only a pending application can be withdrawn");
  return prisma.application.update({ where: { id }, data: { status: "withdrawn" } });
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

export const listAll = async (filters) => {
  const applications = await prisma.application.findMany({
    where: filters,
    include: {
      site: { select: { name: true, reference: true, fee: true } },
      vendor: { select: { id: true, fullName: true, email: true, trade: true, _count: { select: { documents: true } } } }
    },
    orderBy: { appliedAt: "asc" }
  });
  if (filters.status !== "pending") return applications;

  const seen = {};
  return applications.map((a) => {
    seen[a.siteId] = (seen[a.siteId] ?? 0) + 1;
    return { ...a, queuePosition: seen[a.siteId] };
  });
};

export const decide = async (adminId, id, { outcome, reason, reasonCategory, outOfOrder }) => {
  const application = await prisma.application.findUnique({ where: { id }, include: { site: true } });
  if (!application) throw new HttpError(404, "not_found", "Application not found");
  if (application.status !== "pending") throw new HttpError(409, "already_decided", "This application was already decided");
  if (outcome === "approved" && application.site.status !== "available") throw new HttpError(409, "site_unavailable", "This site is not open for allocation");

  return prisma.$transaction(async (tx) => {
    const position = await queuePosition(application, tx);
    const waiting = await tx.application.count({ where: { siteId: application.siteId, status: "pending" } });
    const skipped = outcome === "approved" && position > 1;
    if (skipped && !outOfOrder) {
      throw new HttpError(409, "out_of_queue_order", `${position - 1} earlier application(s) are still waiting. Decide them first, or confirm an override with a full reason.`, { position });
    }

    const updated = await tx.application.update({ where: { id }, data: { status: outcome } });
    await tx.allocation.create({
      data: {
        siteId: application.siteId,
        applicationId: id,
        outcome,
        reason,
        reasonCategory: skipped ? "override" : reasonCategory,
        queuePosition: position,
        waitingCount: waiting,
        outOfOrder: skipped,
        decidedById: adminId
      }
    });
    await tx.notification.create({
      data: {
        userId: application.vendorId,
        title: `Application ${outcome}`,
        body: `Your application for ${application.site.name} was ${outcome}. Reason: ${reason}`
      }
    });
    if (outcome === "approved") await tx.site.update({ where: { id: application.siteId }, data: { status: "allocated" } });
    return updated;
  });
};
