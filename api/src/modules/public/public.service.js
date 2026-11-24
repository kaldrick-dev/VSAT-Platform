import { prisma } from "../../lib/prisma.js";

// Public data describes spaces and events, never people: no vendor, applicant or reason fields.
export const listSpaces = async () => {
  const sites = await prisma.site.findMany({ orderBy: { reference: "asc" } });
  return sites.map((s) => ({
    reference: s.reference, name: s.name, district: s.district, sector: s.sector, status: s.status,
    type: s.type, size: s.size, fee: s.fee, latitude: Number(s.latitude), longitude: Number(s.longitude), terms: s.terms
  }));
};

const REASON_LABELS = {
  queue_order: "First in queue order",
  documents: "Documents",
  eligibility: "Eligibility",
  site_terms: "Site terms",
  override: "Queue override",
  other: "Other"
};

// Day filters are inclusive: "to" covers the whole day.
export const dateRange = ({ from, to }) => ({
  ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
  ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {})
});

export const listActivity = async (filters = {}) => {
  const allocations = await prisma.allocation.findMany({
    where: { outcome: { in: ["approved", "revoked"] }, decidedAt: dateRange(filters) },
    include: { site: { select: { name: true, district: true } } },
    orderBy: { decidedAt: "desc" }
  });
  return allocations.map((a) => ({
    id: a.id,
    date: a.decidedAt.toISOString().slice(0, 10),
    site: a.site.name,
    district: a.site.district,
    event: a.outcome === "approved" ? "Allocated" : "Revoked",
    queuePosition: a.queuePosition || null,
    waitingCount: a.waitingCount || null,
    outOfOrder: a.outOfOrder,
    reasonCategory: REASON_LABELS[a.reasonCategory] ?? "Other"
  }));
};

export const listFlags = async (filters = {}) => {
  const flags = await prisma.flag.findMany({ where: { createdAt: dateRange(filters) }, orderBy: { createdAt: "desc" } });
  return flags.map((f) => ({
    id: f.id,
    allocationId: f.allocationId,
    date: f.createdAt.toISOString().slice(0, 10),
    category: f.category,
    status: f.status
  }));
};
