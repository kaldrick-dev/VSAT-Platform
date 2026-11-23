import { prisma } from "../../lib/prisma.js";

// There is no update or delete here on purpose: the log is insert-only.
export const listAllocations = (user, filters) =>
  prisma.allocation.findMany({
    where: { ...filters, ...(user.role === "vendor" ? { application: { vendorId: user.sub } } : {}) },
    include: {
      site: { select: { name: true, reference: true } },
      application: { select: { id: true, vendorId: true } }
    },
    orderBy: { decidedAt: "desc" }
  });
