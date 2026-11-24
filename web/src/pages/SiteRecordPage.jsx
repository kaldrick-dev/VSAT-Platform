import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Card, Chip, EmptyState, Eyebrow, Page, PageHeader, StatusChip } from "../components/ui.jsx";
import { formatRwf } from "../data/sites.js";
import { shortId } from "../hooks/usePublicData.js";
import { useApi } from "../hooks/useApi.js";
import { api } from "../lib/api.js";
import { formatDay } from "../lib/format.js";

const FLAG_TONE = { open: "warn", upheld: "good", dismissed: "idle" };
const FLAG_LABEL = { open: "Open", upheld: "Upheld", dismissed: "Dismissed" };

/** Allocation record of one space, shown inside the account. Same data the public API exposes: no people. */
export function SiteRecordPage() {
  const { id } = useParams();
  const load = useCallback(() => Promise.all([api.getSite(id), api.publicData("activity"), api.publicData("flags")])
    .then(([site, activity, flags]) => {
      const entries = activity.data.filter((e) => e.reference === site.data.reference);
      const ids = new Set(entries.map((e) => e.id));
      return { site: site.data, entries, flags: flags.data.filter((f) => ids.has(f.allocationId)) };
    }), [id]);
  const { data, error } = useApi(load, null);

  if (error) return <Page><EmptyState title="Could not open this record">{error}</EmptyState></Page>;
  if (!data) return <Page><p className="text-sm text-mute">Loading…</p></Page>;
  const { site, entries, flags } = data;

  return (
    <Page>
      <PageHeader title={site.name} description={`${site.sector}, ${site.district} · ${site.type} · ${site.size}`} actions={<Button variant="secondary" to="/sites">Back to the map</Button>} />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.5fr]">
        <Card className="p-6">
          <div className="flex items-center gap-2"><StatusChip status={site.status} /><Eyebrow>{site.reference}</Eyebrow></div>
          <dl className="mt-5 grid gap-4 text-[13.5px]">
            <div><Eyebrow>Published monthly fee</Eyebrow><dd className="mt-1 text-[22px] font-semibold tabular-nums">{formatRwf(site.fee)}</dd></div>
            <div><Eyebrow>Published terms</Eyebrow><dd className="mt-1 leading-relaxed text-mute">{site.terms}</dd></div>
          </dl>
          <p className="mt-5 text-xs text-faint">Applicant and vendor details are never part of this record.</p>
        </Card>

        <div className="grid gap-5">
          <Card className="p-6">
            <h2 className="text-[15px] font-semibold">Allocation history</h2>
            <ul className="mt-4 grid gap-3">
              {entries.map((e) => (
                <li key={e.id} className="rounded-2xl bg-sunken/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12.5px] font-medium">{shortId("EV", e.id)}</span>
                    <Chip tone={e.event === "Allocated" ? "info" : "idle"}>{e.event}</Chip>
                    {e.outOfOrder && <Chip tone="bad">Out of queue order</Chip>}
                    <span className="text-xs text-mute">{formatDay(e.date)}</span>
                  </div>
                  <p className="mt-2 text-[13px] text-mute">
                    Queue: {e.queuePosition ? `${e.queuePosition} of ${e.waitingCount}` : "not recorded"} · Basis: {e.reasonCategory}
                  </p>
                </li>
              ))}
            </ul>
            {!entries.length && <EmptyState title="No allocation recorded">This space has no allocation entries yet.</EmptyState>}
          </Card>

          <Card className="p-6">
            <h2 className="text-[15px] font-semibold">Questions raised</h2>
            <ul className="mt-4 grid gap-3">
              {flags.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="font-mono text-[12.5px] font-medium">{shortId("FL", f.id)}</span>
                  <Chip tone={FLAG_TONE[f.status]}>{FLAG_LABEL[f.status]}</Chip>
                  {f.overdue && <Chip tone="bad">Overdue</Chip>}
                  <span className="text-mute">{f.category} · raised {formatDay(f.date)} · {f.daysToAnswer === null ? `answer due ${formatDay(f.dueDate)}` : `answered in ${f.daysToAnswer} days`}</span>
                </li>
              ))}
            </ul>
            {!flags.length && <p className="mt-3 text-[13px] text-mute">No flags have been raised on this space.</p>}
            <p className="mt-4 text-[13px]"><Link to="/records" className="underline underline-offset-2">Open the full allocation record</Link></p>
          </Card>
        </div>
      </div>
    </Page>
  );
}
