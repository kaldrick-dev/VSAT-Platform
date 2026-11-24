import { useCallback, useState } from "react";
import { Button, Card, Chip, Dropdown, EmptyState, Field, Icon, Page, PageHeader, fieldClass } from "../components/ui.jsx";
import { FLAG_CATEGORIES } from "../data/workspace.js";
import { useApi } from "../hooks/useApi.js";
import { usePublicData, shortId } from "../hooks/usePublicData.js";
import { api } from "../lib/api.js";
import { formatDay } from "../lib/format.js";

const TONE = { open: "warn", upheld: "good", dismissed: "idle" };
const LABEL = { open: "Open", upheld: "Upheld", dismissed: "Dismissed" };

export function MyFlagsPage() {
  const call = useCallback(() => api.myFlags().then((res) => res.data), []);
  const { data: flags, reload } = useApi(call, []);
  const { activity } = usePublicData();
  const allocated = activity.filter((e) => e.event === "Allocated");

  const [allocationId, setAllocationId] = useState("");
  const [category, setCategory] = useState(FLAG_CATEGORIES[0]);
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.flagAllocation(allocationId || allocated[0].id, { category, note: details.trim() });
      setDetails("");
      setSent(true);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Page>
      <PageHeader title="My flags" description="If an allocation did not follow the published rules, flag it here. An administrator reviews every flag." />
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold">Flag an allocation</h2>
          <form className="mt-5 grid gap-4" onSubmit={submit}>
            <Field label="Allocation">
              {allocated.length ? (
                <Dropdown label="Allocation" value={allocationId || allocated[0].id} onChange={(v) => { setAllocationId(v); setSent(false); }} options={allocated.map((e) => [e.id, `${shortId("EV", e.id)} · ${e.site}`])} />
              ) : (
                <p className="text-[13px] text-mute">No allocations have been made yet.</p>
              )}
            </Field>
            <Field label="What went wrong?">
              <Dropdown label="Category" value={category} onChange={(v) => { setCategory(v); setSent(false); }} options={FLAG_CATEGORIES.map((c) => [c, c])} />
            </Field>
            <Field label="Details" hint="Visible to administrators only. The public sees the category, date and status.">
              <textarea rows="4" required minLength={5} value={details} onChange={(e) => { setDetails(e.target.value); setSent(false); }} className={`${fieldClass} h-auto resize-y py-2.5`} placeholder="Explain what you believe did not follow the rules." />
            </Field>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={details.trim().length < 5 || !allocated.length}>Submit flag<Icon name="flag" className="size-4" /></Button>
              <span role="status" className="text-[13px] text-good">{sent ? "Flag submitted" : ""}</span>
              {error && <span role="alert" className="text-[13px] text-red-600">{error}</span>}
            </div>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-5 pb-3 pt-5"><h2 className="text-[15px] font-semibold">Flags you raised</h2></div>
          {flags.map((f) => (
            <article key={f.id} className="border-t border-line px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[12.5px] font-medium">{shortId("FL", f.id)}</span>
                <Chip tone={TONE[f.status]}>{LABEL[f.status]}</Chip>
                <span className="text-xs text-mute">{f.category} · {shortId("EV", f.allocationId)} · {formatDay(f.createdAt)}{f.status === "open" && ` · answer due ${formatDay(f.dueAt)}`}</span>
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed">{f.note}</p>
              {f.reviewNote && <p className="mt-2 rounded-xl bg-sunken px-3 py-2 text-[13px] text-mute">Administrator: {f.reviewNote}</p>}
            </article>
          ))}
          {!flags.length && <EmptyState title="No flags yet">Flags you raise will be listed here with their status.</EmptyState>}
        </Card>
      </div>
    </Page>
  );
}
