import { prisma } from "../../lib/prisma.js";

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
