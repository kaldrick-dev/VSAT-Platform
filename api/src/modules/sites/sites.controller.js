import * as sitesService from "./sites.service.js";

export const list = async (req, res) => {
  res.json({ data: await sitesService.listSites(req.query) });
};

export const get = async (req, res) => {
  res.json({ data: await sitesService.getSite(req.params.id) });
};

export const create = async (req, res) => {
  res.status(201).json({ data: await sitesService.createSite(req.body) });
};

export const remove = async (req, res) => {
  await sitesService.removeSite(req.params.id);
  res.status(204).end();
};

export const update = async (req, res) => {
  res.json({ data: await sitesService.updateSite(req.params.id, req.body) });
};
