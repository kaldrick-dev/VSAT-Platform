import { prisma } from "../../lib/prisma.js";

// Public data describes spaces and events, never people: no vendor, applicant or reason fields.
export const listSpaces = async () => {
  const sites = await prisma.site.findMany({ orderBy: { reference: "asc" } });
  return sites.map((s) => ({
    reference: s.reference, name: s.name, district: s.district, sector: s.sector, status: s.status,
    type: s.type, size: s.size, fee: s.fee, latitude: Number(s.latitude), longitude: Number(s.longitude), terms: s.terms
  }));
};

export const listActivity = async () => {
  const allocations = await prisma.allocation.findMany({
    where: { outcome: { in: ["approved", "revoked"] } },
    include: { site: { select: { name: true, district: true } } },
    orderBy: { decidedAt: "desc" }
  });
  return allocations.map((a) => ({
    id: a.id,
    date: a.decidedAt.toISOString().slice(0, 10),
    site: a.site.name,
    district: a.site.district,
    event: a.outcome === "approved" ? "Allocated" : "Revoked"
  }));
};

export const listFlags = async () => {
  const flags = await prisma.flag.findMany({ orderBy: { createdAt: "desc" } });
  return flags.map((f) => ({
    id: f.id,
    allocationId: f.allocationId,
    date: f.createdAt.toISOString().slice(0, 10),
    category: f.category,
    status: f.status
  }));
};
