import { useCallback, useState } from "react";
import { Button, Chip, Dropdown, EmptyState, Eyebrow, Field, Icon, Page, PageHeader, StatStrip, fieldClass } from "../components/ui.jsx";
import { useApi } from "../hooks/useApi.js";
import { shortId } from "../hooks/usePublicData.js";
import { api, downloadDocument } from "../lib/api.js";
import { formatDateTime, formatSize, timeAgo } from "../lib/format.js";
import { formatRwf } from "../data/sites.js";

function VendorDocuments({ vendorId }) {
  const call = useCallback(() => api.vendorDocuments(vendorId).then((res) => res.data), [vendorId]);
  const { data: docs } = useApi(call, []);
  const [error, setError] = useState("");
  if (!docs.length) return <p className="text-[13px] text-mute">No documents attached.</p>;
  return (
    <>
      <ul className="grid gap-1.5">
        {docs.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
            <span className="font-medium">{d.name}</span>
            <span className="text-mute">{d.kind}{d.size ? ` · ${formatSize(d.size)}` : ""}</span>
            {d.fileName
              ? <button type="button" className="underline underline-offset-2" onClick={() => downloadDocument(d).catch((err) => setError(err.message))}>Download</button>
              : <a className="underline underline-offset-2" href={d.url} target="_blank" rel="noreferrer">Open link</a>}
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="mt-1 text-[13px] text-red-600">{error}</p>}
    </>
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
  const needed = override ? 20 : 3;
  const typed = reason.trim().length;
  const blocker = skipping && !override
    ? "Tick the override box above to approve out of order."
    : typed < needed
      ? `Write a reason of at least ${needed} characters (${typed} so far) to enable Approve.`
      : "";

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
    <div className="grid gap-5 px-4 pb-5 pt-1 lg:grid-cols-2 lg:gap-8 lg:px-6">
      <div className="grid content-start gap-4 text-[13.5px]">
        <div>
          <Eyebrow className="text-mute">Applicant</Eyebrow>
          <p className="mt-1 font-medium">{application.vendor.fullName}</p>
          <p className="text-mute">{application.vendor.email}</p>
          <p className="text-mute">{application.vendor.trade ?? "Trade not given"}</p>
        </div>
        <div>
          <Eyebrow className="text-mute">Their statement</Eyebrow>
          <p className="mt-1 whitespace-pre-line leading-relaxed">{application.statement || "None given"}</p>
        </div>
        <div>
          <Eyebrow className="text-mute">Documents</Eyebrow>
          <div className="mt-1"><VendorDocuments vendorId={application.vendor.id} /></div>
        </div>
      </div>

      <form className="grid content-start gap-4 rounded-2xl bg-surface p-4 shadow-card" onSubmit={(event) => event.preventDefault()}>
        <h3 className="text-[15px] font-semibold">Record a decision</h3>

        {skipping && (
          <div className="rounded-xl bg-warn-soft px-4 py-3 text-[13px] text-warn">
            <p className="font-medium">{application.queuePosition - 1} earlier application(s) for this site are still waiting.</p>
            <label className="mt-2 flex items-start gap-2">
              <input type="checkbox" className="mt-0.5 size-5 shrink-0" checked={override} onChange={(event) => setOverride(event.target.checked)} />
              <span>Approve out of queue order anyway. This is published as <em>out of queue order</em> and needs a reason of at least 20 characters.</span>
            </label>
          </div>
        )}

        <Field label="Reason category (published)">
          <Dropdown label="Reason category" value={category} onChange={setCategory} options={CATEGORIES} />
        </Field>
        <Field label={override ? "Reason for the override (recorded in the log)" : "Reason (recorded in the log)"}>
          <textarea rows="3" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. First eligible applicant in timestamp order" className={`${fieldClass} h-auto resize-y py-2.5`} />
        </Field>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={busy || typed < 3} onClick={() => decide("rejected")}>Reject application</Button>
          <Button disabled={busy || !!blocker} onClick={() => decide("approved")}>
            Approve and allocate
            <Icon name="arrow" className="size-4" />
          </Button>
        </div>
        {blocker && <p className="text-[12.5px] text-mute">{blocker}</p>}
        {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
        <p className="flex items-center gap-1.5 text-xs text-mute">
          <Icon name="lock" className="size-3" /> Once recorded, this decision cannot be edited or deleted.
        </p>
      </form>
    </div>
  );
}

function QueueRow({ application, open, onToggle, onDecided }) {
  const docs = application.vendor._count.documents;
  const next = application.queuePosition === 1;
  return (
    <div className="overflow-hidden rounded-xl bg-surface">
      <button type="button" onClick={onToggle} aria-expanded={open} className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 text-left transition hover:bg-sunken/60 lg:grid-cols-[auto_1.4fr_1fr_auto_auto]">
        <span className={`grid size-10 place-items-center rounded-xl font-mono text-[15px] font-semibold ${next ? "bg-accent text-white" : "bg-sunken text-ink"}`} aria-label={`Position ${application.queuePosition} in the queue`}>
          {application.queuePosition}
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[14.5px] font-semibold">{application.vendor.fullName}</span>
            {next && <Chip tone="good">Next to decide</Chip>}
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-mute">{application.vendor.trade ?? "Trade not given"} · {shortId("APP", application.id)}</span>
        </span>
        <span className="col-span-2 col-start-2 text-[13px] text-mute lg:col-span-1 lg:col-start-auto">
          <span className="block font-medium text-ink">Applied {timeAgo(application.appliedAt)}</span>
          <span className="block">{formatDateTime(application.appliedAt)}</span>
        </span>
        <span className="col-start-2 justify-self-start lg:col-start-auto lg:justify-self-auto"><Chip tone={docs ? "good" : "bad"}>{docs ? `${docs} document${docs > 1 ? "s" : ""}` : "No documents"}</Chip></span>
        <Icon name="chevron" className={`col-start-3 row-start-1 size-5 text-mute transition-transform lg:col-start-auto lg:row-start-auto ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-line bg-frame/60 pt-4"><DecisionForm application={application} onDecided={onDecided} /></div>}
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
  const { data, loading, error, reload } = useApi(call, { queue: [], sites: [], decisions: [], flags: [] });
  const { queue } = data;
  const [openId, setOpenId] = useState(null);

  const groups = [];
  queue.forEach((application) => {
    const group = groups.find((g) => g.site.id === application.siteId);
    if (group) group.items.push(application);
    else groups.push({ site: { id: application.siteId, ...application.site }, items: [application] });
  });

  return (
    <Page>
      <PageHeader
        title="Application queue"
        description="Publish verified sites, review queues in timestamp order, and record decisions that cannot be silently edited or deleted."
        actions={<Button to="/admin/sites?new=1"><Icon name="plus" className="size-4" />Add vending site</Button>}
      />

      <StatStrip
        loading={loading}
        items={[
          { label: "Pending applications", value: queue.length },
          { label: "Published sites", value: data.sites.length },
          { label: "Decisions logged", value: data.decisions.length, delta: "append-only" },
          { label: "Flags awaiting review", value: data.flags.length, tone: data.flags.length ? "down" : "flat" }
        ]}
      />

      {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
      <p className="text-[13.5px] text-mute">Each site has its own queue. Decide the application marked <strong className="font-semibold text-ink">Next to decide</strong> first. Approving anyone further down needs a written override that is published on the public log.</p>

      {groups.map(({ site, items }) => (
        <section key={site.id} className="rounded-2xl bg-frame p-2" aria-label={`${site.name} queue`}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 pb-3 pt-3">
            <div>
              <h2 className="text-[16px] font-semibold tracking-[-0.01em]">{site.name}</h2>
              <p className="text-[13px] text-mute">{site.reference} · {formatRwf(site.fee)} / month</p>
            </div>
            <Chip tone="warn">{items.length} waiting</Chip>
          </div>
          <div className="grid gap-1.5">
            {items.map((application) => (
              <QueueRow key={application.id} application={application} open={openId === application.id}
                onToggle={() => setOpenId(openId === application.id ? null : application.id)}
                onDecided={() => { setOpenId(null); reload(); }} />
            ))}
          </div>
        </section>
      ))}
      {!queue.length && <EmptyState loading={loading} title="The queue is empty">No applications are waiting for a decision.</EmptyState>}
    </Page>
  );
}
