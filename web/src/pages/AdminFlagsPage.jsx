import { useState } from "react";
import { Button, Card, Chip, EmptyState, Eyebrow, Field, Icon, Page, PageHeader, Segmented, fieldClass } from "../components/ui.jsx";
import { formatDate } from "../data/records.js";
import { adminFlagsSeed } from "../data/workspace.js";

const TONE = { Open: "warn", "Under review": "info", Resolved: "good", Dismissed: "idle" };

function FlagCard({ flag, onUpdate }) {
  const [note, setNote] = useState(flag.note);
  const closed = flag.status === "Resolved" || flag.status === "Dismissed";
  return (
    <article className="border-t border-line p-5 first:border-t-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[12.5px] font-medium">{flag.id}</span>
        <Chip tone={TONE[flag.status]}>{flag.status}</Chip>
        <span className="text-xs text-mute">{flag.category} · {flag.site} ({flag.event}) · {formatDate(flag.date)}</span>
      </div>
      <p className="mt-2.5 text-[13.5px] leading-relaxed">{flag.details}</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-faint"><Icon name="lock" className="size-3" />Raised by {flag.by}. Not shown publicly.</p>

      {closed ? (
        <p className="mt-3 rounded-xl bg-sunken px-3 py-2 text-[13px] text-mute">Outcome note (public): {flag.note}</p>
      ) : (
        <form className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end" onSubmit={(e) => e.preventDefault()}>
          <Field label="Outcome note (published with the status)">
            <textarea rows="2" className={`${fieldClass} h-auto resize-none py-2.5`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Reviewed against the published queue order." />
          </Field>
          <div className="flex flex-wrap gap-2">
            {flag.status === "Open" && <Button variant="ghost" onClick={() => onUpdate(flag.id, { status: "Under review" })}>Start review</Button>}
            <Button variant="secondary" disabled={!note.trim()} onClick={() => onUpdate(flag.id, { status: "Dismissed", note: note.trim() })}>Dismiss</Button>
            <Button disabled={!note.trim()} onClick={() => onUpdate(flag.id, { status: "Resolved", note: note.trim() })}>Resolve</Button>
          </div>
        </form>
      )}
    </article>
  );
}

export function AdminFlagsPage() {
  const [flags, setFlags] = useState(adminFlagsSeed);
  const [view, setView] = useState("open");
  const update = (id, patch) => setFlags((list) => list.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const open = flags.filter((f) => f.status === "Open" || f.status === "Under review");
  const shown = view === "open" ? open : flags;

  return (
    <Page>
      <PageHeader title="Flag review" description="Vendors flag allocations they believe broke the published rules. Close each one with a note; the public sees only the category, status and your note." actions={<Segmented label="Show flags" value={view} onChange={setView} options={[["open", "Needs review", open.length], ["all", "All", flags.length]]} />} />
      <Card className="overflow-hidden">
        {shown.map((f) => <FlagCard key={f.id + f.status} flag={f} onUpdate={update} />)}
        {!shown.length && <EmptyState title="Nothing to review">No flags are waiting.</EmptyState>}
      </Card>
      <Eyebrow>Closed flags stay in the log. They are never deleted.</Eyebrow>
    </Page>
  );
}
