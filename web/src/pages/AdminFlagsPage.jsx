import { useCallback, useState } from "react";
import { Button, Card, Chip, EmptyState, Eyebrow, Field, Icon, Page, PageHeader, Segmented, fieldClass } from "../components/ui.jsx";
import { useApi } from "../hooks/useApi.js";
import { shortId } from "../hooks/usePublicData.js";
import { api } from "../lib/api.js";
import { formatDay } from "../lib/format.js";

const TONE = { open: "warn", upheld: "good", dismissed: "idle" };
const LABEL = { open: "Open", upheld: "Upheld", dismissed: "Dismissed" };

function FlagCard({ flag, onReviewed }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const closed = flag.status !== "open";

  async function review(status) {
    try {
      await api.reviewFlag(flag.id, { status, reviewNote: note.trim() });
      onReviewed();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <article className="border-t border-line p-5 first:border-t-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[12.5px] font-medium">{shortId("FL", flag.id)}</span>
        <Chip tone={TONE[flag.status]}>{LABEL[flag.status]}</Chip>
        {!closed && <Chip tone={new Date(flag.dueAt) < new Date() ? "bad" : "idle"}>{new Date(flag.dueAt) < new Date() ? "Overdue, was due " : "Answer due "}{formatDay(flag.dueAt)}</Chip>}
        <span className="text-xs text-mute">{flag.category} · {flag.allocation.site.name} ({shortId("EV", flag.allocationId)}) · {formatDay(flag.createdAt)}</span>
      </div>
      <p className="mt-2.5 text-[13.5px] leading-relaxed">{flag.note}</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-faint"><Icon name="lock" className="size-3" />Raised by {flag.vendor.fullName}. Not shown publicly.</p>

      {closed ? (
        <p className="mt-3 rounded-xl bg-sunken px-3 py-2 text-[13px] text-mute">Outcome note (sent to the vendor): {flag.reviewNote}</p>
      ) : (
        <form className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end" onSubmit={(e) => e.preventDefault()}>
          <Field label="Outcome note (sent to the vendor)">
            <textarea rows="2" className={`${fieldClass} h-auto resize-none py-2.5`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Reviewed against the published queue order." />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={note.trim().length < 3} onClick={() => review("dismissed")}>Dismiss</Button>
            <Button disabled={note.trim().length < 3} onClick={() => review("upheld")}>Uphold</Button>
          </div>
        </form>
      )}
      {error && <p role="alert" className="mt-2 text-[13px] text-red-600">{error}</p>}
    </article>
  );
}

export function AdminFlagsPage() {
  const call = useCallback(() => api.listFlags().then((res) => res.data), []);
  const { data: flags, loading, error, reload } = useApi(call, []);
  const [view, setView] = useState("open");
  const open = flags.filter((f) => f.status === "open");
  const shown = view === "open" ? open : flags;

  return (
    <Page>
      <PageHeader title="Flag review" description="Vendors flag allocations they believe broke the published rules. Close each one with a note; the public sees only the category, date and status." actions={<Segmented label="Show flags" value={view} onChange={setView} options={[["open", "Needs review", open.length], ["all", "All", flags.length]]} />} />
      {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
      <Card className="overflow-hidden">
        {shown.map((f) => <FlagCard key={f.id + f.status} flag={f} onReviewed={reload} />)}
        {!shown.length && <EmptyState loading={loading} title="Nothing to review">No flags are waiting.</EmptyState>}
      </Card>
      <Eyebrow>Closed flags stay in the log. They are never deleted.</Eyebrow>
    </Page>
  );
}
