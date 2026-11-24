import { useState } from "react";
import { Icon } from "./ui.jsx";
import { formatDate } from "../data/records.js";
import { downloadDataset } from "../lib/api.js";

export function DownloadButtons({ dataset, className = "pv-btn pv-btn-line pv-btn-sm" }) {
  const [error, setError] = useState("");
  const download = (format) => downloadDataset(dataset.key, format).then(() => setError("")).catch((err) => setError(err.message));
  return (
    <>
      <button type="button" className={className} onClick={() => download("csv")} aria-label={`Download ${dataset.title} as CSV`}>
        CSV <Icon name="arrow" className="rotate-90" />
      </button>
      <button type="button" className={className} onClick={() => download("json")} aria-label={`Download ${dataset.title} as JSON`}>
        JSON <Icon name="arrow" className="rotate-90" />
      </button>
      {error && <span role="alert" className="pv-muted">{error}</span>}
    </>
  );
}

export const datasetMeta = (rows, updated) =>
  `${rows.length} records${updated ? ` · Updated ${formatDate(updated)}` : ""}`;

export const latestDate = (...lists) =>
  lists.flat().reduce((latest, row) => (row.date && row.date > latest ? row.date : latest), "");
