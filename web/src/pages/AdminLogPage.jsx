import { useCallback, useMemo, useState } from "react";
import { Button, Card, Chip, EmptyState, Eyebrow, Icon, Page, PageHeader, Segmented, fieldClass } from "../components/ui.jsx";
import { useApi } from "../hooks/useApi.js";
import { shortId } from "../hooks/usePublicData.js";
import { api } from "../lib/api.js";
import { formatDay } from "../lib/format.js";
import { downloadFile, toCsv } from "../lib/download.js";

const COLUMNS = [["id", "Reference"], ["date", "Date"], ["site", "Site"], ["outcome", "Outcome"], ["application", "Application"], ["applicant", "Applicant"], ["queue", "Queue"], ["reason", "Stated reason"], ["by", "Decided by"]];

const toRow = (a) => ({
  id: shortId("EV", a.id), date: a.decidedAt.slice(0, 10), site: a.site.name, outcome: a.outcome === "approved" ? "Approved" : "Rejected",
  application: shortId("APP", a.application.id), applicant: a.application.vendor.fullName, reason: a.reason, queue: a.queuePosition ? `${a.queuePosition} of ${a.waitingCount}` : "n/a", outOfOrder: a.outOfOrder, by: a.decidedBy
});

export function AdminLogPage() {
  const [q, setQ] = useState("");
  const [outcome, setOutcome] = useState("all");
  const call = useCallback(() => api.listAllocations().then((res) => res.data.map(toRow)), []);
  const { data: decisionLog, loading, error } = useApi(call, []);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return decisionLog.filter((d) => (outcome === "all" || d.outcome === outcome) && (!term || [d.id, d.site, d.application, d.reason].some((t) => t.toLowerCase().includes(term))));
  }, [decisionLog, q, outcome]);

  return (
    <Page>
      <PageHeader
        title="Decision log"
        description="Every decision with its stated reason and the application it concerned. Append-only: a correction is a new entry."
        actions={<Button variant="secondary" onClick={() => downloadFile("vsat-decision-log.csv", toCsv(decisionLog, COLUMNS), "text/csv")}>Export CSV</Button>}
      />
      <p className="flex items-center gap-2 rounded-2xl bg-warn-soft px-4 py-3 text-[13px] text-warn"><Icon name="lock" className="size-4 shrink-0" />This log contains applicant details and reasons. It is for administrators only and is never published.</p>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <input className={`${fieldClass} max-w-[320px]`} type="search" aria-label="Search the decision log" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference, site, application or reason" />
          <Segmented label="Outcome" value={outcome} onChange={setOutcome} options={[["all", "All"], ["Approved", "Approved"], ["Rejected", "Rejected"]]} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <caption className="sr-only">Decision log, newest first</caption>
            <thead><tr className="border-y border-line">{COLUMNS.map(([k, h]) => <th key={k} scope="col" className="px-5 py-2.5"><Eyebrow>{h}</Eyebrow></th>)}</tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-t border-line first:border-t-0 align-top hover:bg-sunken/50">
                  <th scope="row" className="px-5 py-3.5 font-mono text-[12.5px] font-medium">{d.id}</th>
                  <td className="whitespace-nowrap px-5 py-3.5 text-[13px]">{formatDay(d.date)}</td>
                  <td className="px-5 py-3.5 text-[13.5px] font-medium">{d.site}</td>
                  <td className="px-5 py-3.5"><Chip tone={d.outcome === "Approved" ? "good" : "bad"}>{d.outcome}</Chip></td>
                  <td className="px-5 py-3.5 font-mono text-[12.5px]">{d.application}</td>
                  <td className="px-5 py-3.5 text-[13px]">{d.applicant}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-[13px] tabular-nums">{d.queue}{d.outOfOrder && <> <Chip tone="bad">Out of order</Chip></>}</td>
                  <td className="max-w-[34ch] px-5 py-3.5 text-[13.5px] leading-relaxed text-mute">{d.reason}</td>
                  <td className="px-5 py-3.5 text-[13px]">{d.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {error && <p role="alert" className="px-5 py-3 text-[13px] text-red-600">{error}</p>}
          {!rows.length && <EmptyState loading={loading} title="No decisions match">Try a different search or filter.</EmptyState>}
        </div>
      </Card>
    </Page>
  );
}
