import { Icon } from "./ui.jsx";
import { formatDate } from "../data/records.js";
import { publicUrl } from "../lib/api.js";

export function DownloadButtons({ dataset, className = "pv-btn pv-btn-line pv-btn-sm" }) {
  return (
    <>
      <a className={className} href={publicUrl(dataset.key, "csv")} download aria-label={`Download ${dataset.title} as CSV`}>
        CSV <Icon name="arrow" className="rotate-90" />
      </a>
      <a className={className} href={publicUrl(dataset.key, "json")} download aria-label={`Download ${dataset.title} as JSON`}>
        JSON <Icon name="arrow" className="rotate-90" />
      </a>
    </>
  );
}

export const datasetMeta = (rows, updated) =>
  `${rows.length} records${updated ? ` · Updated ${formatDate(updated)}` : ""}`;

export const latestDate = (...lists) =>
  lists.flat().reduce((latest, row) => (row.date && row.date > latest ? row.date : latest), "");
