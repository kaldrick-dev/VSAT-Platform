import * as applicationsService from "./applications.service.js";

export const apply = async (req, res) => {
  res.status(201).json({ data: await applicationsService.apply(req.user.sub, req.params.siteId, req.body) });
};

export const listMine = async (req, res) => {
  res.json({ data: await applicationsService.listMine(req.user.sub) });
};

export const listAll = async (req, res) => {
  res.json({ data: await applicationsService.listAll(req.query) });
};

export const decide = async (req, res) => {
  res.json({ data: await applicationsService.decide(req.user.sub, req.params.id, req.body) });
};
