import { Icon } from "./ui.jsx";
import { formatDate, lastUpdated } from "../data/records.js";
import { downloadFile, toCsv } from "../lib/download.js";

export function DownloadButtons({ dataset, className = "pv-btn pv-btn-line pv-btn-sm" }) {
  return (
    <>
      <button type="button" className={className} aria-label={`Download ${dataset.title} as CSV`}
        onClick={() => downloadFile(`vsat-${dataset.key}.csv`, toCsv(dataset.rows, dataset.columns), "text/csv")}>
        CSV <Icon name="arrow" className="rotate-90" />
      </button>
      <button type="button" className={className} aria-label={`Download ${dataset.title} as JSON`}
        onClick={() => downloadFile(`vsat-${dataset.key}.json`, JSON.stringify(dataset.rows, null, 2), "application/json")}>
        JSON <Icon name="arrow" className="rotate-90" />
      </button>
    </>
  );
}

export const datasetMeta = (dataset) => `${dataset.rows.length} records · Updated ${formatDate(lastUpdated)}`;
