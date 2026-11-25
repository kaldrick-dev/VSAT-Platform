import { prisma } from "../../lib/prisma.js";

// Public data describes spaces and events, never people: no vendor, applicant or reason fields.
export const listSpaces = async () => {
  const sites = await prisma.site.findMany({ where: { removedAt: null }, orderBy: { reference: "asc" } });
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
  violation: "Rule violation",
  not_used: "Space not used",
  error: "Recorded in error",
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
    include: { site: { select: { name: true, district: true, reference: true } } },
    orderBy: { decidedAt: "desc" }
  });
  return allocations.map((a) => ({
    id: a.id,
    date: a.decidedAt.toISOString().slice(0, 10),
    site: a.site.name,
    reference: a.site.reference,
    district: a.site.district,
    event: a.outcome === "approved" ? "Allocated" : "Revoked",
    queuePosition: a.queuePosition || null,
    waitingCount: a.waitingCount || null,
    outOfOrder: a.outOfOrder,
    reasonCategory: REASON_LABELS[a.reasonCategory] ?? "Other"
  }));
};

const DAY_MS = 24 * 60 * 60 * 1000;
const daysBetween = (start, end) => Math.round(((end - start) / DAY_MS) * 10) / 10;

export const listFlags = async (filters = {}) => {
  const flags = await prisma.flag.findMany({ where: { createdAt: dateRange(filters) }, orderBy: { createdAt: "desc" } });
  const now = new Date();
  return flags.map((f) => ({
    id: f.id,
    allocationId: f.allocationId,
    date: f.createdAt.toISOString().slice(0, 10),
    category: f.category,
    status: f.status,
    dueDate: f.dueAt.toISOString().slice(0, 10),
    overdue: f.status === "open" && f.dueAt < now,
    daysToAnswer: f.reviewedAt ? daysBetween(f.createdAt, f.reviewedAt) : null
  }));
};

export const getSummary = async (filters = {}) => {
  const range = dateRange(filters);
  const [allocations, flags] = await Promise.all([
    prisma.allocation.findMany({ where: { outcome: "approved", decidedAt: range }, include: { site: { select: { district: true } } } }),
    prisma.flag.findMany({ where: { createdAt: range } })
  ]);

  const byDistrict = {};
  allocations.forEach((a) => { byDistrict[a.site.district] = (byDistrict[a.site.district] ?? 0) + 1; });

  const answered = flags.filter((f) => f.reviewedAt);
  const days = answered.map((f) => daysBetween(f.createdAt, f.reviewedAt));
  const now = new Date();
  return {
    allocations: {
      total: allocations.length,
      outOfOrder: allocations.filter((a) => a.outOfOrder).length,
      byDistrict: Object.entries(byDistrict).map(([district, count]) => ({ district, count })).sort((a, b) => b.count - a.count)
    },
    flags: {
      raised: flags.length,
      answered: answered.length,
      answeredOnTime: answered.filter((f) => f.reviewedAt <= f.dueAt).length,
      overdue: flags.filter((f) => f.status === "open" && f.dueAt < now).length,
      upheld: flags.filter((f) => f.status === "upheld").length,
      averageDaysToAnswer: days.length ? Math.round((days.reduce((sum, d) => sum + d, 0) / days.length) * 10) / 10 : null
    }
  };
};
