import { useCallback, useEffect, useState } from "react";
import { Button, Card, Chip, Dropdown, EmptyState, Eyebrow, Field, Icon, Page, PageHeader, StatStrip, fieldClass } from "../components/ui.jsx";
import { useApi } from "../hooks/useApi.js";
import { shortId } from "../hooks/usePublicData.js";
import { api } from "../lib/api.js";
import { formatDateTime } from "../lib/format.js";

const COLUMNS = "md:grid-cols-[.9fr_1.6fr_1.2fr_1fr_28px]";

function VendorDocuments({ vendorId }) {
  const call = useCallback(() => api.vendorDocuments(vendorId).then((res) => res.data), [vendorId]);
  const { data: docs } = useApi(call, []);
  if (!docs.length) return <p className="text-[13px] text-mute">No documents attached.</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {docs.map((d) => <li key={d.id}><a className="text-[13px] underline underline-offset-2" href={d.url} target="_blank" rel="noreferrer">{d.name} ({d.kind})</a></li>)}
    </ul>
  );
}

const CATEGORIES = [
  ["queue_order", "First in queue order"],
  ["documents", "Documents missing or invalid"],
  ["eligibility", "Not eligible for this site"],
  ["site_terms", "Site terms not met"],
  ["other", "Other"]
];

function DecisionForm({ application, onDecided }) {
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("queue_order");
  const [override, setOverride] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const skipping = application.queuePosition > 1;
  const longEnough = reason.trim().length >= (override ? 20 : 3);

  async function decide(outcome) {
    setBusy(true);
    setError("");
    try {
      await api.decideApplication(application.id, { outcome, reason: reason.trim(), reasonCategory: category, outOfOrder: outcome === "approved" && skipping && override });
      onDecided();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 px-5 pb-5 pt-1">
      <dl className="grid gap-2 text-[13px] sm:grid-cols-2">
        <div><Eyebrow>Applicant</Eyebrow><dd className="mt-1 font-medium">{application.vendor.fullName} · {application.vendor.email}</dd></div>
        <div><Eyebrow>Statement</Eyebrow><dd className="mt-1 text-mute">{application.statement || "None given"}</dd></div>
      </dl>
      <div><Eyebrow>Documents</Eyebrow><div className="mt-1"><VendorDocuments vendorId={application.vendor.id} /></div></div>

      {skipping && (
        <div className="rounded-2xl bg-sunken px-4 py-3 text-[13px]">
          <p><strong className="font-medium">{application.queuePosition - 1} earlier application(s) for this site are still waiting.</strong> You can reject this one, or decide the earlier ones first.</p>
          <label className="mt-2 flex items-start gap-2">
            <input type="checkbox" className="mt-0.5" checked={override} onChange={(event) => setOverride(event.target.checked)} />
            <span>Approve anyway. This is published on the public log as <em>out of queue order</em>, and the reason must be at least 20 characters.</span>
          </label>
        </div>
      )}

      <form className="grid gap-4 md:grid-cols-[14rem_1fr_auto] md:items-end" onSubmit={(event) => event.preventDefault()}>
        <Field label="Reason category (published)">
          <Dropdown label="Reason category" value={category} onChange={setCategory} options={CATEGORIES} />
        </Field>
        <Field label={override ? "Reason for the override (20+ characters)" : "Stated reason (required)"}>
          <textarea rows="2" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. First eligible applicant in timestamp order" className={`${fieldClass} h-auto resize-none py-2.5`} />
        </Field>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={busy || reason.trim().length < 3} onClick={() => decide("rejected")}>Reject</Button>
          <Button disabled={busy || !longEnough || (skipping && !override)} onClick={() => decide("approved")}>
            Approve {shortId("APP", application.id)}
            <Icon name="arrow" className="size-4" />
          </Button>
        </div>
      </form>
      {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
      <p className="flex items-center gap-1.5 text-xs text-faint">
        <Icon name="lock" className="size-3" /> Once recorded, this decision cannot be edited or deleted.
      </p>
    </div>
  );
}

export function AdminPage() {
  const call = useCallback(() => Promise.all([
    api.listApplications({ status: "pending" }),
    api.listSites(),
    api.listAllocations(),
    api.listFlags({ status: "open" })
  ]).then(([applications, sites, allocations, flags]) => ({ queue: applications.data, sites: sites.data, decisions: allocations.data, flags: flags.data })), []);
  const { data, error, reload } = useApi(call, { queue: [], sites: [], decisions: [], flags: [] });
  const { queue } = data;
  const [openId, setOpenId] = useState(null);

  useEffect(() => { if (!openId && queue.length) setOpenId(queue[0].id); }, [queue, openId]);

  return (
    <Page>
      <PageHeader
        title="Application queue"
        description="Publish verified sites, review queues in timestamp order, and record decisions that cannot be silently edited or deleted."
        actions={<Button to="/admin/sites?new=1"><Icon name="plus" className="size-4" />Add vending site</Button>}
      />

      <StatStrip
        items={[
          { label: "Pending applications", value: queue.length },
          { label: "Published sites", value: data.sites.length },
          { label: "Decisions logged", value: data.decisions.length, delta: "append-only" },
          { label: "Flags awaiting review", value: data.flags.length, tone: data.flags.length ? "down" : "flat" }
        ]}
      />

      {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-5">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Application queue</h2>
            <p className="mt-0.5 text-[13px] text-mute">Oldest first. Positions are fixed by submission time.</p>
          </div>
          <Chip tone="warn">{queue.length} pending</Chip>
        </div>

        <div className={`hidden gap-x-4 border-y border-line px-5 py-2.5 md:grid ${COLUMNS}`}>
          <Eyebrow>Reference</Eyebrow><Eyebrow>Site</Eyebrow><Eyebrow>Submitted</Eyebrow><Eyebrow>Documents</Eyebrow><span />
        </div>

        {queue.map((application) => {
          const open = openId === application.id;
          const docs = application.vendor._count.documents;
          return (
            <div key={application.id} className={`border-t border-line first:border-t-0 ${open ? "bg-sunken/50" : ""}`}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : application.id)}
                aria-expanded={open}
                className={`grid w-full items-center gap-x-4 gap-y-1.5 px-5 py-3.5 text-left transition hover:bg-sunken/50 ${COLUMNS}`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="grid size-6 place-items-center rounded-md bg-sunken font-mono text-[11px] text-mute" title="Position in this site's queue">{application.queuePosition}</span>
                  <span className="font-mono text-[12.5px] font-medium">{shortId("APP", application.id)}</span>
                </span>
                <span>
                  <span className="block text-[13.5px] font-medium">{application.site.name}</span>
                  <span className="block text-xs text-mute">{application.vendor.trade ?? "Trade not given"}</span>
                </span>
                <span className="text-[13px] tabular-nums text-mute">{formatDateTime(application.appliedAt)}</span>
                <span><Chip tone={docs ? "good" : "bad"}>{docs ? `${docs} attached` : "None"}</Chip></span>
                <Icon name="chevron" className={`hidden size-4 justify-self-end text-faint transition-transform md:block ${open ? "rotate-180" : ""}`} />
              </button>
              {open && <DecisionForm application={application} onDecided={() => { setOpenId(null); reload(); }} />}
            </div>
          );
        })}
        {!queue.length && <EmptyState title="The queue is empty">No applications are waiting for a decision.</EmptyState>}
      </Card>
    </Page>
  );
}
