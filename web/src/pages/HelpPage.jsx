import { useState } from "react";
import { Card, Icon, Page, PageHeader } from "../components/ui.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { ROLES } from "../lib/access.js";

const FAQ = {
  vendor: [
    ["How do I apply for a space?", "Open the Site map, choose an available space and press Apply. Your application is timestamped the moment you submit it."],
    ["How is my queue position decided?", "Strictly by the time you applied. Your position changes only when an earlier application is decided or withdrawn."],
    ["What documents do I need?", "A national ID and a trading licence or association letter. Add them under Profile & documents. Missing documents can delay review."],
    ["How do I flag an allocation?", "Go to My flags, choose the allocation, pick a category and explain what went wrong. An administrator reviews it and publishes the outcome."],
    ["What can the public see about me?", "Nothing personal. The public sees which spaces are open and dated changes to them, never vendor or applicant names."],
    ["Do I pay through this platform?", "No. The platform records decisions only. Fees are paid outside it."]
  ],
  admin: [
    ["In what order should I review applications?", "Oldest first. The Application queue is sorted by submission time, and positions are fixed by that timestamp."],
    ["Can I edit or delete a decision?", "No. Decisions are append-only. To correct a mistake, record a new decision. The earlier entry stays as written."],
    ["How do I publish a new space?", "Manage sites, then Add vending site. Fill in the details and click the map to set the location."],
    ["What happens when I resolve a flag?", "The flag's status and your outcome note become public. The vendor's details and free-text explanation stay private."],
    ["What is shown publicly?", "Open spaces, their fees and terms, and a dated log of listings, allocations and pauses. Never applicant details or decision reasons."]
  ]
};

function Item({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-line first:border-t-0">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-sunken/50">
        <span className="text-[14px] font-medium">{q}</span>
        <Icon name="chevron" className={`size-4 shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-5 pb-4 text-[13.5px] leading-relaxed text-mute">{a}</p>}
    </div>
  );
}

export function HelpPage() {
  const { role } = useAuth();
  const items = FAQ[role === ROLES.ADMIN ? "admin" : "vendor"];
  return (
    <Page>
      <PageHeader title="Help" description="Short answers to common questions." />
      <Card className="max-w-[760px] overflow-hidden">{items.map(([q, a]) => <Item key={q} q={q} a={a} />)}</Card>
    </Page>
  );
}
