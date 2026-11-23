import { useState } from "react";
import { adminQueue as queue } from "../data/workspace.js";
import { Button, Card, Chip, Eyebrow, Field, Icon, Page, PageHeader, StatStrip, fieldClass } from "../components/ui.jsx";

const COLUMNS = "md:grid-cols-[.9fr_1.6fr_1.2fr_1fr_28px]";

function DecisionForm({ application }) {
  const [reason, setReason] = useState("");
  return (
    <form className="grid gap-4 px-5 pb-5 pt-1 md:grid-cols-[1fr_auto] md:items-end" onSubmit={(event) => event.preventDefault()}>
      <Field label="Stated reason (required, published with the decision)">
        <textarea
          rows="2"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. First eligible applicant in timestamp order"
          className={`${fieldClass} h-auto resize-none py-2.5`}
        />
      </Field>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={!reason.trim()}>Reject</Button>
        <Button disabled={!reason.trim()}>
          Approve {application.ref}
          <Icon name="arrow" className="size-4" />
        </Button>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-faint md:col-span-2">
        <Icon name="lock" className="size-3" /> Once recorded, this decision cannot be edited or deleted.
      </p>
    </form>
  );
}

export function AdminPage() {
  const [openRef, setOpenRef] = useState(queue[0].ref);

  return (
    <Page>
      <PageHeader
        title="Application queue"
        description="Publish verified sites, review queues in timestamp order, and record decisions that cannot be silently edited or deleted."
        actions={<Button to="/admin/sites?new=1"><Icon name="plus" className="size-4" />Add vending site</Button>}
      />

      <StatStrip
        items={[
          { label: "Pending applications", value: 13, delta: "5 shown" },
          { label: "Published sites", value: 7 },
          { label: "Decisions logged", value: 24, delta: "append-only" },
          { label: "Flags awaiting review", value: 1, tone: "down" }
        ]}
      />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-5">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Application queue</h2>
            <p className="mt-0.5 text-[13px] text-mute">Oldest first. Positions are fixed by submission time.</p>
          </div>
          <Chip tone="warn">13 pending</Chip>
        </div>

        <div className={`hidden gap-x-4 border-y border-line px-5 py-2.5 md:grid ${COLUMNS}`}>
          <Eyebrow>Reference</Eyebrow><Eyebrow>Site</Eyebrow><Eyebrow>Submitted</Eyebrow><Eyebrow>Documents</Eyebrow><span />
        </div>

        {queue.map((application, index) => {
          const open = openRef === application.ref;
          return (
            <div key={application.ref} className={`border-t border-line first:border-t-0 ${open ? "bg-sunken/50" : ""}`}>
              <button
                type="button"
                onClick={() => setOpenRef(open ? null : application.ref)}
                aria-expanded={open}
                className={`grid w-full items-center gap-x-4 gap-y-1.5 px-5 py-3.5 text-left transition hover:bg-sunken/50 ${COLUMNS}`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="grid size-6 place-items-center rounded-md bg-sunken font-mono text-[11px] text-mute">{index + 1}</span>
                  <span className="font-mono text-[12.5px] font-medium">{application.ref}</span>
                </span>
                <span>
                  <span className="block text-[13.5px] font-medium">{application.site}</span>
                  <span className="block text-xs text-mute">{application.trade}</span>
                </span>
                <span className="text-[13px] tabular-nums text-mute">{application.submitted}</span>
                <span><Chip tone={application.docs === "Complete" ? "good" : "bad"}>{application.docs}</Chip></span>
                <Icon name="chevron" className={`hidden size-4 justify-self-end text-faint transition-transform md:block ${open ? "rotate-180" : ""}`} />
              </button>
              {open && <DecisionForm application={application} />}
            </div>
          );
        })}
      </Card>
    </Page>
  );
}
