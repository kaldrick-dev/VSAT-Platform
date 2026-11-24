import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { toCsv } from "../../utils/csv.js";
import { formatSchema, summarySchema } from "./public.schemas.js";
import * as publicService from "./public.service.js";

export const publicRoutes = Router();

publicRoutes.use(requireAuth);

const send = (res, format, name, rows) => {
  if (format === "csv") {
    res.type("text/csv").attachment(`${name}.csv`).send(toCsv(rows, Object.keys(rows[0] ?? {})));
    return;
  }
  if (format === "json") res.attachment(`${name}.json`);
  res.json({ data: rows });
};

const datasets = { spaces: publicService.listSpaces, activity: publicService.listActivity, flags: publicService.listFlags };

for (const [name, load] of Object.entries(datasets)) {
  publicRoutes.get(`/${name}`, validate({ query: formatSchema }), async (req, res) => {
    send(res, req.query.format, name, await load(req.query));
  });
}

publicRoutes.get("/summary", validate({ query: summarySchema }), async (req, res) => {
  res.json({ data: await publicService.getSummary(req.query) });
});
