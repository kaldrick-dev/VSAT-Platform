import { useCallback } from "react";
import { Button, Card, Chip, EmptyState, Icon, Page, PageHeader, Ring, StatStrip } from "../components/ui.jsx";
import { useApi } from "../hooks/useApi.js";
import { api } from "../lib/api.js";
import { formatDateTime } from "../lib/format.js";

const TONE = { pending: "warn", approved: "good", rejected: "bad", withdrawn: "idle" };
const LABEL = { pending: "Pending review", approved: "Approved", rejected: "Rejected", withdrawn: "Withdrawn" };

function ApplicationCard({ application }) {
  const { site, status, queuePosition } = application;
  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
      <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
      {queuePosition ? (
        <Ring value={1 / queuePosition} size={80} stroke={7} label={`Queue position ${queuePosition}`}>
          <span>
            <span className="block text-[26px] font-semibold tracking-[-0.03em] tabular-nums">{queuePosition}</span>
            <span className="mt-1 block font-mono text-[9.5px] uppercase tracking-[0.08em] text-faint">in queue</span>
          </span>
        </Ring>
      ) : (
        <span className="grid size-[80px] shrink-0 place-items-center rounded-full bg-sunken"><Icon name={status === "approved" ? "check" : "minus"} className="size-6" /></span>
      )}
        <div className="min-w-0 flex-1">
        <Chip tone={TONE[status]}>{LABEL[status]}</Chip>
        <h2 className="mt-2 text-lg font-semibold tracking-[-0.015em] sm:text-xl">{site.name}</h2>
        <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-mute">
          <Icon name="pin" className="size-3.5" /> {site.reference} · {site.district}
        </p>
        <p className="mt-1 text-[13px] text-mute">Applied {formatDateTime(application.appliedAt)}</p>
        </div>
      </div>
      <Button variant="secondary" to="/sites" className="w-full sm:w-auto">View on map<Icon name="arrowUpRight" className="size-3.5" /></Button>
    </Card>
  );
}

export function VendorPage() {
  const call = useCallback(() => api.myApplications().then((res) => res.data), []);
  const { data: applications, loading, error } = useApi(call, []);

  const count = (status) => applications.filter((a) => a.status === status).length;
  const next = applications.find((a) => a.status === "pending");

  return (
    <Page>
      <PageHeader
        title="My applications"
        description="Each application is timestamped. Your queue position changes only when earlier applications are decided."
        actions={<Button variant="secondary" to="/sites">Browse sites</Button>}
      />

      <StatStrip
        loading={loading}
        items={[
          { label: "Pending", value: count("pending") },
          { label: "Approved", value: count("approved"), tone: "up" },
          { label: "Rejected", value: count("rejected") },
          { label: "Next position", value: next ? `#${next.queuePosition}` : "-" }
        ]}
      />

      {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
      <div className="grid gap-4">
        {applications.map((a) => <ApplicationCard key={a.id} application={a} />)}
        {!applications.length && (
          <Card><EmptyState loading={loading} title="No applications yet">Open the site map and apply for a space.</EmptyState></Card>
        )}
      </div>
    </Page>
  );
}
