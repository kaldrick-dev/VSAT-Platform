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
  const sites = await prisma.site.findMany({ where: filters, include: withQueue, orderBy: { reference: "asc" } });
  return sites.map(toSite);
};

export const getSite = async (id) => {
  const site = await prisma.site.findUnique({ where: { id }, include: withQueue });
  if (!site) throw new HttpError(404, "not_found", "Site not found");
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
