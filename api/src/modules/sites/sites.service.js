import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../utils/http-error.js";

const toSite = (site) => ({
  ...site,
  latitude: Number(site.latitude),
  longitude: Number(site.longitude)
});

export const listSites = async (filters) => {
  const sites = await prisma.site.findMany({ where: filters, orderBy: { reference: "asc" } });
  return sites.map(toSite);
};

export const getSite = async (id) => {
  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) throw new HttpError(404, "not_found", "Site not found");
  return toSite(site);
};

export const createSite = async (data) => {
  const taken = await prisma.site.findUnique({ where: { reference: data.reference } });
  if (taken) throw new HttpError(409, "reference_taken", "That site reference already exists");
  return toSite(await prisma.site.create({ data }));
};

export const updateSite = async (id, data) => {
  await getSite(id);
  return toSite(await prisma.site.update({ where: { id }, data }));
};
