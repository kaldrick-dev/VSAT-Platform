import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../utils/http-error.js";

const withQueue = { _count: { select: { applications: { where: { status: "pending" } } } } };

const toSite = ({ _count, ...site }) => ({
  ...site,
  latitude: Number(site.latitude),
  longitude: Number(site.longitude),
  queue: _count?.applications ?? 0
});

export const listSites = async (filters) => {
  const sites = await prisma.site.findMany({ where: { ...filters, removedAt: null }, include: withQueue, orderBy: { reference: "asc" } });
  return sites.map(toSite);
};

export const getSite = async (id) => {
  const site = await prisma.site.findUnique({ where: { id }, include: withQueue });
  if (!site || site.removedAt) throw new HttpError(404, "not_found", "Site not found");
  return toSite(site);
};

export const createSite = async (data) => {
  const taken = data.reference && (await prisma.site.findUnique({ where: { reference: data.reference } }));
  if (taken) throw new HttpError(409, "reference_taken", "That site reference already exists");
  return toSite(await prisma.site.create({ data: { ...data, reference: data.reference ?? `VSAT-${Date.now().toString().slice(-6)}` }, include: withQueue }));
};

export const updateSite = async (id, data) => {
  await getSite(id);
  return toSite(await prisma.site.update({ where: { id }, data, include: withQueue }));
};

// A removed site leaves the map and the lists, but its decisions stay in the insert-only log.
export const removeSite = async (id) => {
  const site = await getSite(id);
  if (site.status === "allocated") throw new HttpError(409, "site_allocated", "Revoke the allocation before removing this site");
  if (site.queue > 0) throw new HttpError(409, "has_pending_applications", "Decide the pending applications before removing this site");
  await prisma.site.update({ where: { id }, data: { removedAt: new Date() } });
};
