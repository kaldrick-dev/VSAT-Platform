import { useState } from "react";
import { Button, Card, Chip, Dropdown, EmptyState, Field, Icon, Page, PageHeader, fieldClass } from "../components/ui.jsx";
import { FLAG_CATEGORIES, myFlagsSeed } from "../data/workspace.js";
import { formatDate, statusLog } from "../data/records.js";

const TONE = { Open: "warn", "Under review": "info", Resolved: "good", Dismissed: "idle" };
const ALLOCATED = statusLog.filter((e) => e.event === "Allocated");

export function MyFlagsPage() {
  const [flags, setFlags] = useState(myFlagsSeed);
  const [event, setEvent] = useState(ALLOCATED[0].id);
  const [category, setCategory] = useState(FLAG_CATEGORIES[0]);
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (details.trim().length < 10) return;
    setFlags([{ id: `FL-${String(8 + flags.length).padStart(4, "0")}`, event, date: new Date().toISOString().slice(0, 10), category, details: details.trim(), status: "Open", note: "" }, ...flags]);
    setDetails("");
    setSent(true);
  }

  return (
    <Page>
      <PageHeader title="My flags" description="If an allocation did not follow the published rules, flag it here. An administrator reviews every flag." />
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold">Flag an allocation</h2>
          <form className="mt-5 grid gap-4" onSubmit={submit}>
            <Field label="Allocation">
              <Dropdown label="Allocation" value={event} onChange={(v) => { setEvent(v); setSent(false); }} options={ALLOCATED.map((e) => [e.id, `${e.id} · ${e.site}`])} />
            </Field>
            <Field label="What went wrong?">
              <Dropdown label="Category" value={category} onChange={(v) => { setCategory(v); setSent(false); }} options={FLAG_CATEGORIES.map((c) => [c, c])} />
            </Field>
            <Field label="Details" hint="Visible to administrators only. The public sees the category, date and status.">
              <textarea rows="4" required minLength={10} value={details} onChange={(e) => { setDetails(e.target.value); setSent(false); }} className={`${fieldClass} h-auto resize-y py-2.5`} placeholder="Explain what you believe did not follow the rules." />
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={details.trim().length < 10}>Submit flag<Icon name="flag" className="size-4" /></Button>
              <span role="status" className="text-[13px] text-good">{sent ? "Flag submitted" : ""}</span>
            </div>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-5 pb-3 pt-5"><h2 className="text-[15px] font-semibold">Flags you raised</h2></div>
          {flags.map((f) => (
            <article key={f.id} className="border-t border-line px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[12.5px] font-medium">{f.id}</span>
                <Chip tone={TONE[f.status]}>{f.status}</Chip>
                <span className="text-xs text-mute">{f.category} · {f.event} · {formatDate(f.date)}</span>
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed">{f.details}</p>
              {f.note && <p className="mt-2 rounded-xl bg-sunken px-3 py-2 text-[13px] text-mute">Administrator: {f.note}</p>}
            </article>
          ))}
          {!flags.length && <EmptyState title="No flags yet">Flags you raise will be listed here with their status.</EmptyState>}
        </Card>
      </div>
    </Page>
  );
}
