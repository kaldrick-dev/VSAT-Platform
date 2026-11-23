import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DownloadButtons, datasetMeta } from "../components/DocumentActions.jsx";
import { PvSelect } from "../components/PvSelect.jsx";
import { Icon } from "../components/ui.jsx";
import { DATASETS } from "../data/datasets.js";
import { flags, formatDate, lastUpdated, statusLog } from "../data/records.js";
import { districts, formatRwf, sites } from "../data/sites.js";

const STATUS = { available: ["good", "Available"], allocated: ["info", "Allocated"], inactive: ["idle", "Paused"] };
const EVENT_TONE = { Listed: "good", Allocated: "info", Paused: "idle" };
const FLAG_TONE = { Open: "warn", "Under review": "info", Resolved: "good", Dismissed: "idle" };
const ORDER = { available: 0, allocated: 1, inactive: 2 };

export function RecordsPage() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState("all");
  const [district, setDistrict] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sites
      .filter((s) =>
        (status === "all" || s.status === status) &&
        (district === "all" || s.district === district) &&
        (!q || [s.reference, s.name, s.district, s.sector, s.type, STATUS[s.status][1]].some((text) => text.toLowerCase().includes(q))))
      .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.name.localeCompare(b.name));
  }, [search, status, district]);

  const openCount = sites.filter((s) => s.status === "available").length;

  return (
    <>
      <section className="pv-top">
        <div className="pv-wrap">
          <nav className="pv-crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link> / <span aria-current="page">Public records</span></nav>
          <h1 className="pv-h1">Public records</h1>
          <p className="lead">Which vending spaces are open, what they cost, and every change to their status. Open to everyone, no account needed. Information about individual vendors and applicants is never published.</p>
          <span className="pv-stamp"><i />{openCount} spaces open now · Updated {formatDate(lastUpdated)}</span>
          <div className="pv-jump">
            <a href="#spaces" className="pv-btn pv-btn-glass pv-btn-sm">Available spaces</a>
            <a href="#activity" className="pv-btn pv-btn-glass pv-btn-sm">Activity log</a>
            <a href="#flags" className="pv-btn pv-btn-glass pv-btn-sm">Flag log</a>
            <a href="#documents" className="pv-btn pv-btn-glass pv-btn-sm">Downloads</a>
          </div>
        </div>
      </section>

      <section className="pv-sec" id="spaces" aria-labelledby="spaces-h">
        <div className="pv-wrap">
          <div className="pv-head pv-rv">
            <div>
              <span className="pv-eyebrow"><i />Registry</span>
              <h2 id="spaces-h" className="pv-h2">Vending spaces</h2>
            </div>
            <p className="pv-muted">Open spaces are listed first. Fees are monthly and paid outside this platform.</p>
          </div>

          <form className="pv-filters" role="search" onSubmit={(e) => e.preventDefault()}>
            <label className="pv-field">Search spaces
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, district, sector or trade" />
            </label>
            <PvSelect label="Status" value={status} onChange={setStatus} options={[["all", "All statuses"], ["available", "Available"], ["allocated", "Allocated"], ["inactive", "Paused"]]} />
            <PvSelect label="District" value={district} onChange={setDistrict} options={[["all", "All districts"], ...districts.map((name) => [name, name])]} />
          </form>

          <div className="pv-table-wrap">
            <table className="pv-table">
              <caption className="sr-only">Vending spaces</caption>
              <thead><tr>{["Reference", "Space", "Permitted trade", "Size", "Monthly fee", "Status"].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <th scope="row">{s.reference}</th>
                    <td style={{ maxWidth: "40ch" }}><b>{s.name}</b><span className="sub">{s.sector}, {s.district}</span><span className="sub">{s.terms}</span></td>
                    <td>{s.type}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{s.size}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{formatRwf(s.fee)}</td>
                    <td><span className={`pv-pill ${STATUS[s.status][0]}`}>{STATUS[s.status][1]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && <p className="pv-empty">No spaces match. Try a different search or clear the filters.</p>}
          </div>
          <p className="pv-note">Showing {filtered.length} of {sites.length} spaces. <Link to="/#map" className="underline underline-offset-4">See them on the map</Link>.</p>
        </div>
      </section>

      <section className="pv-sec pv-dark" id="activity" aria-labelledby="activity-h">
        <div className="pv-wrap">
          <div className="pv-head pv-rv">
            <div>
              <span className="pv-eyebrow"><i />Activity</span>
              <h2 id="activity-h" className="pv-h2">Activity log</h2>
            </div>
            <p className="pv-muted">Newest first. Entries are permanent. A correction is recorded as a new entry, and earlier entries stay as written.</p>
          </div>
          <div className="pv-table-wrap pv-rv">
            <table className="pv-table">
              <caption className="sr-only">Changes to vending spaces, newest first</caption>
              <thead><tr>{["Reference", "Date", "Space", "Event", "Note"].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
              <tbody>
                {statusLog.map((e) => (
                  <tr key={e.id}>
                    <th scope="row">{e.id}</th>
                    <td style={{ whiteSpace: "nowrap" }}>{formatDate(e.date)}</td>
                    <td><b>{e.site}</b><span className="sub">{e.district}</span></td>
                    <td><span className={`pv-pill ${EVENT_TONE[e.event]}`}>{e.event}</span></td>
                    <td style={{ maxWidth: "40ch" }}>{e.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="pv-sec" id="flags" aria-labelledby="flags-h">
        <div className="pv-wrap">
          <div className="pv-head pv-rv">
            <div>
              <span className="pv-eyebrow"><i />Questions raised</span>
              <h2 id="flags-h" className="pv-h2">Flag log</h2>
            </div>
            <p className="pv-muted">Registered vendors can flag an allocation they believe did not follow the stated rules. Only the category, date and status are public.</p>
          </div>
          <div className="pv-table-wrap pv-rv">
            <table className="pv-table">
              <caption className="sr-only">Flags raised against allocations</caption>
              <thead><tr>{["Reference", "Activity entry", "Date raised", "Category", "Status"].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
              <tbody>
                {flags.map((f) => (
                  <tr key={f.id}>
                    <th scope="row">{f.id}</th>
                    <td className="mono">{f.event}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{formatDate(f.date)}</td>
                    <td>{f.category}{f.note && <span className="sub">{f.note}</span>}</td>
                    <td><span className={`pv-pill ${FLAG_TONE[f.status]}`}>{f.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!flags.length && <p className="pv-empty">No flags raised. Nothing has been questioned yet.</p>}
          </div>
        </div>
      </section>

      <section className="pv-sec pv-dark" id="documents" style={{ paddingTop: 0 }} aria-labelledby="documents-h">
        <div className="pv-wrap">
          <div className="pv-head pv-rv">
            <div>
              <span className="pv-eyebrow"><i />Download</span>
              <h2 id="documents-h" className="pv-h2">Documents and data</h2>
            </div>
            <p className="pv-muted">Open datasets you can download, reuse and check against the tables above.</p>
          </div>
          <div className="pv-doclist pv-rv">
            {DATASETS.map((d) => (
              <article key={d.key} className="pv-docrow">
                <div className="l">
                  <span className="sheet"><Icon name="record" className="size-5" /></span>
                  <div><h3>{d.title}</h3><p>{d.description}</p><div className="meta">{datasetMeta(d)}</div></div>
                </div>
                <div className="pv-row"><DownloadButtons dataset={d} className="pv-btn pv-btn-glass pv-btn-sm" /></div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
