import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../utils/http-error.js";

// There is no update or delete here on purpose: the log is insert-only.
export const listAllocations = async (user, filters) => {
  const allocations = await prisma.allocation.findMany({
    where: { ...filters, ...(user.role === "vendor" ? { application: { vendorId: user.sub } } : {}) },
    include: {
      site: { select: { name: true, reference: true } },
      application: { select: { id: true, vendorId: true, vendor: { select: { fullName: true } } } }
    },
    orderBy: { decidedAt: "desc" }
  });

  if (user.role === "vendor") return allocations.map(({ decidedById, ...entry }) => entry);

  const admins = await prisma.user.findMany({ where: { id: { in: allocations.map((a) => a.decidedById) } }, select: { id: true, fullName: true } });
  const names = Object.fromEntries(admins.map((a) => [a.id, a.fullName]));
  return allocations.map((a) => ({ ...a, decidedBy: names[a.decidedById] }));
};

// The approval is never edited: a revocation is a new entry that points at the same application.
export const revokeSite = async (adminId, siteId, { reason, reasonCategory }) => {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) throw new HttpError(404, "not_found", "Site not found");

  return prisma.$transaction(async (tx) => {
    const latest = await tx.allocation.findFirst({
      where: { siteId, outcome: { in: ["approved", "revoked"] } },
      orderBy: { decidedAt: "desc" },
      include: { application: true }
    });
    if (site.status !== "allocated" || latest?.outcome !== "approved") {
      throw new HttpError(409, "no_active_allocation", "This site has no active allocation to revoke");
    }

    const entry = await tx.allocation.create({
      data: { siteId, applicationId: latest.applicationId, outcome: "revoked", reason, reasonCategory, decidedById: adminId }
    });
    await tx.application.update({ where: { id: latest.applicationId }, data: { status: "revoked" } });
    await tx.site.update({ where: { id: siteId }, data: { status: "available" } });
    await tx.notification.create({
      data: {
        userId: latest.application.vendorId,
        title: "Allocation revoked",
        body: `Your allocation of ${site.name} was revoked. Reason: ${reason}`
      }
    });
    return entry;
  });
};
