import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { toCsv } from "../../utils/csv.js";
import { formatSchema } from "./public.schemas.js";
import * as publicService from "./public.service.js";

export const publicRoutes = Router();

const send = (res, format, name, rows) => {
  if (format === "csv") {
    res.type("text/csv").attachment(`${name}.csv`).send(toCsv(rows, Object.keys(rows[0] ?? {})));
    return;
  }
  res.json({ data: rows });
};

const datasets = { spaces: publicService.listSpaces, activity: publicService.listActivity, flags: publicService.listFlags };

for (const [name, load] of Object.entries(datasets)) {
  publicRoutes.get(`/${name}`, validate({ query: formatSchema }), async (req, res) => {
    send(res, req.query.format, name, await load());
  });
}
