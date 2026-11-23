import { vendorApplication as application } from "../data/workspace.js";
import { Button, Card, Chip, Eyebrow, Icon, Page, PageHeader, Ring, StatStrip } from "../components/ui.jsx";

const steps = [
  { title: "Application recorded", body: "Your timestamp fixes your initial place in the queue.", state: "done", time: "14 Nov · 09:42" },
  { title: "Eligibility review", body: "An administrator checks the published site terms.", state: "current", time: "In progress" },
  { title: "Decision published", body: "The outcome and stated reason enter the permanent public log.", state: "upcoming", time: "Pending" }
];

function StepMarker({ state }) {
  if (state === "done") {
    return <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-surface"><Icon name="check" className="size-3.5" /></span>;
  }
  if (state === "current") {
    return <span className="grid size-7 shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-surface"><span className="size-2 animate-pulse rounded-full bg-ink" /></span>;
  }
  return <span className="block size-7 shrink-0 rounded-full border-[1.5px] border-dashed border-faint bg-surface" />;
}

export function VendorPage() {
  const ahead = application.position - 1;
  const progress = (application.total - application.position + 1) / application.total;

  return (
    <Page>
      <PageHeader
        title="My applications"
        description="Each application is timestamped. Your queue position changes only when earlier applications are decided or withdrawn."
        actions={<Button variant="secondary" to="/sites">Browse sites</Button>}
      />

      <StatStrip
        items={[
          { label: "Queue position", value: `#${application.position}`, delta: `of ${application.total}` },
          { label: "Ahead of you", value: ahead, delta: ahead === 1 ? "application" : "applications" },
          { label: "Applied", value: "14 Nov", delta: "09:42" },
          { label: "Monthly fee", value: application.fee }
        ]}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-5 p-6">
            <Ring value={progress} size={92} stroke={7} label={`Position ${application.position} of ${application.total}`}>
              <span>
                <span className="block text-[26px] font-semibold tracking-[-0.03em] tabular-nums">{application.position}</span>
                <span className="mt-1 block font-mono text-[9.5px] uppercase tracking-[0.08em] text-faint">of {application.total}</span>
              </span>
            </Ring>
            <div className="min-w-0 flex-1">
              <Chip tone="warn">{application.status}</Chip>
              <h2 className="mt-2.5 text-xl font-semibold tracking-[-0.015em]">{application.site}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-mute">
                <Icon name="pin" className="size-3.5" /> {application.sector}
              </p>
            </div>
            <Button variant="secondary" to="/sites">
              View site
              <Icon name="arrowUpRight" className="size-3.5" />
            </Button>
          </div>

          <div className="border-t border-line p-6">
            <h3 className="text-[14px] font-semibold">What happens next</h3>
            <ol className="mt-5">
              {steps.map((step, index) => (
                <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
                  {index < steps.length - 1 && (
                    <span aria-hidden="true" className={`absolute left-[13.5px] top-8 h-[calc(100%-1.75rem)] w-px ${step.state === "done" ? "bg-ink" : "border-l border-dashed border-faint/60"}`} />
                  )}
                  <span className="relative z-10 shrink-0"><StepMarker state={step.state} /></span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <p className={`text-[13.5px] font-medium ${step.state === "upcoming" ? "text-mute" : ""}`}>{step.title}</p>
                      <Eyebrow>{step.time}</Eyebrow>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-mute">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Card>

        <aside className="grid gap-5">
          <Card className="p-5">
            <h2 className="text-[14px] font-semibold">Application details</h2>
            <dl className="mt-4 grid gap-3.5 text-[13.5px]">
              {[["Reference", application.reference], ["Site fee", `${application.fee} / month`], ["Applied", application.applied], ["Last update", application.updated]].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4">
                  <dt className="text-mute">{label}</dt>
                  <dd className="text-right font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="p-5">
            <h2 className="text-[14px] font-semibold">Need to step back?</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-mute">Withdrawing frees your place. Applicants behind you each move up one position, and the withdrawal is recorded publicly without your name.</p>
            <Button variant="secondary" className="mt-4 w-full text-bad">Withdraw application</Button>
          </Card>
        </aside>
      </div>
    </Page>
  );
}
