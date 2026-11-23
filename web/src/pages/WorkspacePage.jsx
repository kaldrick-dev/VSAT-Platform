import { Link } from "react-router-dom";
import { Button, Chip, Icon, Page, PageHeader, Ring } from "../components/ui.jsx";
import { formatRwf, sites } from "../data/sites.js";
import { adminFlagsSeed, adminQueue, myFlagsSeed, vendorApplication as application } from "../data/workspace.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { useNotifications } from "../hooks/useNotifications.js";
import { ROLES } from "../lib/access.js";

const OPEN = sites.filter((site) => site.status === "available");
const TONE = { up: "text-good", down: "text-bad", flat: "text-faint" };

/** Soft tinted card: no border, no shadow. The page is white, so the tint does the separating. */
function Tile({ label, value, delta, tone = "flat", highlight = false }) {
  return (
    <div className={`rounded-2xl p-5 ${highlight ? "bg-accent-soft" : "bg-frame"}`}>
      <p className={`text-[13px] ${highlight ? "text-accent" : "text-mute"}`}>{label}</p>
      <p className="mt-2 flex items-baseline gap-2">
        <span className={`text-[34px] font-semibold leading-none tracking-[-0.03em] tabular-nums ${highlight ? "text-accent" : ""}`}>{value}</span>
        {delta && <span className={`text-xs font-medium ${TONE[tone]}`}>{delta}</span>}
      </p>
    </div>
  );
}

function Tiles({ children }) {
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>;
}

function Panel({ title, description, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl bg-frame p-2 ${className}`}>
      <div className="flex items-start justify-between gap-3 px-3.5 pb-2 pt-3.5">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-mute">{description}</p>}
        </div>
        {action}
      </div>
      <div className="grid gap-0.5">{children}</div>
    </section>
  );
}

function Row({ to, primary, secondary, end }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl px-3.5 py-3 transition hover:bg-surface">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium">{primary}</span>
        {secondary && <span className="mt-0.5 block truncate text-xs text-mute">{secondary}</span>}
      </span>
      {end}
    </Link>
  );
}

const Go = () => <Icon name="arrow" className="size-4 text-faint" />;

function RecentUpdates({ role }) {
  const { items } = useNotifications(role);
  return (
    <Panel title="Recent updates" action={<Button variant="ghost" size="sm" to="/notifications">View all</Button>}>
      {items.slice(0, 3).map((n) => (
        <Row key={n.id} to="/notifications"
          primary={<>{!n.read && <span className="mr-2 inline-block size-1.5 rounded-full bg-accent align-middle" />}{n.title}</>}
          secondary={n.time} end={<Go />} />
      ))}
      {!items.length && <p className="px-3.5 py-3 text-[13px] text-mute">Nothing new.</p>}
    </Panel>
  );
}

function OpenSpaces({ title }) {
  return (
    <Panel title={title} description={`${OPEN.length} spaces are accepting applications.`} action={<Button variant="ghost" size="sm" to="/sites">Open map</Button>}>
      {OPEN.map((site) => (
        <Row key={site.id} to="/sites" primary={site.name} secondary={`${site.sector}, ${site.district} · ${site.size}`}
          end={<span className="text-[13px] font-medium tabular-nums">{formatRwf(site.fee)}</span>} />
      ))}
    </Panel>
  );
}

function QuickActions({ items }) {
  return (
    <Panel title="Quick actions">
      {items.map(([to, primary, secondary]) => <Row key={to + primary} to={to} primary={primary} secondary={secondary} end={<Go />} />)}
    </Panel>
  );
}

function VendorOverview({ name }) {
  const progress = (application.total - application.position + 1) / application.total;
  const openFlags = myFlagsSeed.filter((f) => f.status === "Open" || f.status === "Under review").length;
  return (
    <Page>
      <PageHeader title={`Welcome, ${name}`} description="Your applications, your place in each queue and the spaces open right now." actions={<Button to="/sites">Browse sites<Icon name="arrow" className="size-4" /></Button>} />

      <Tiles>
        <Tile label="Active applications" value={1} />
        <Tile label="Queue position" value={`#${application.position}`} delta={`of ${application.total}`} highlight />
        <Tile label="Open spaces" value={OPEN.length} delta="to apply for" tone="up" />
        <Tile label="My flags open" value={openFlags} delta={openFlags ? "awaiting review" : "none"} />
      </Tiles>

      <div className="grid items-start gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="grid gap-4">
          <Panel title="Your application" action={<Button variant="ghost" size="sm" to="/vendor">Details</Button>}>
            <div className="flex flex-wrap items-center gap-5 rounded-xl bg-surface p-4">
              <Ring value={progress} size={84} stroke={7} label={`Position ${application.position} of ${application.total}`}>
                <span>
                  <span className="block text-[24px] font-semibold tabular-nums tracking-[-0.03em]">{application.position}</span>
                  <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.08em] text-faint">of {application.total}</span>
                </span>
              </Ring>
              <div className="min-w-0 flex-1">
                <Chip tone="warn">{application.status}</Chip>
                <p className="mt-2 text-[15px] font-semibold">{application.site}</p>
                <p className="text-[13px] text-mute">{application.sector} · applied {application.applied}</p>
              </div>
            </div>
          </Panel>
          <OpenSpaces title="Open spaces you can apply for" />
        </div>
        <div className="grid gap-4">
          <QuickActions items={[
            ["/sites", "Browse the site map", "Filter by status and district"],
            ["/profile", "Update my profile and documents", "Missing documents delay review"],
            ["/vendor", "Track my applications", "Queue position and next steps"],
            ["/flags", "Flag an allocation", "Report a decision that broke the rules"]
          ]} />
          <RecentUpdates role="vendor" />
        </div>
      </div>
    </Page>
  );
}

function AdminOverview({ name }) {
  const openFlags = adminFlagsSeed.filter((f) => f.status === "Open");
  const counts = { available: 0, allocated: 0, inactive: 0 };
  sites.forEach((s) => { counts[s.status] += 1; });
  const missingDocs = adminQueue.filter((a) => a.docs !== "Complete").length;
  return (
    <Page>
      <PageHeader title={`Welcome, ${name}`} description="What needs your attention: the oldest applications, open flags and the state of every listed space." actions={<Button to="/admin">Review queue<Icon name="arrow" className="size-4" /></Button>} />

      <Tiles>
        <Tile label="Pending applications" value={13} delta={missingDocs ? `${missingDocs} missing documents` : undefined} tone="down" />
        <Tile label="Open spaces" value={counts.available} delta={`of ${sites.length} listed`} tone="up" />
        <Tile label="Allocated" value={counts.allocated} />
        <Tile label="Flags awaiting review" value={openFlags.length} tone={openFlags.length ? "down" : "flat"} />
      </Tiles>

      <div className="grid items-start gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="grid gap-4">
          <Panel title="Oldest pending applications" description="Positions are fixed by submission time." action={<Button variant="ghost" size="sm" to="/admin">Open queue</Button>}>
            {adminQueue.slice(0, 4).map((a, i) => (
              <Row key={a.ref} to="/admin"
                primary={<><span className="mr-2 font-mono text-[11px] text-faint">{i + 1}</span>{a.site}</>}
                secondary={`${a.ref} · ${a.trade} · ${a.submitted}`}
                end={<Chip tone={a.docs === "Complete" ? "good" : "bad"}>{a.docs}</Chip>} />
            ))}
          </Panel>
          <RecentUpdates role="admin" />
        </div>
        <div className="grid gap-4">
          <Panel title="Flags awaiting review" action={<Button variant="ghost" size="sm" to="/admin/flags">Review</Button>}>
            {openFlags.length ? openFlags.map((f) => (
              <Row key={f.id} to="/admin/flags" primary={`${f.id} · ${f.category}`} secondary={`On ${f.event} · ${f.site} · raised ${f.date}`} end={<Chip tone="warn">Open</Chip>} />
            )) : <p className="px-3.5 py-3 text-[13px] text-mute">No flags are waiting.</p>}
          </Panel>
          <Panel title="Spaces by status">
            <div className="grid grid-cols-3 gap-2 p-1">
              {[["Available", counts.available, "good"], ["Allocated", counts.allocated, "info"], ["Paused", counts.inactive, "idle"]].map(([label, n, tone]) => (
                <div key={label} className="rounded-xl bg-surface p-3.5">
                  <Chip tone={tone}>{label}</Chip>
                  <p className="mt-3 text-[26px] font-semibold leading-none tabular-nums">{n}</p>
                </div>
              ))}
            </div>
          </Panel>
          <QuickActions items={[
            ["/admin/sites?new=1", "Add a vending site", "Publish a new space"],
            ["/admin/log", "Open the decision log", "Decisions with reasons (admin only)"],
            ["/sites", "Open the site map", "Check locations and status"]
          ]} />
        </div>
      </div>
    </Page>
  );
}

/** The workspace's own home: an overview that adapts to the signed-in role. */
export function WorkspacePage() {
  const { user, role } = useAuth();
  const name = (user?.name ?? user?.email ?? "").split(" ")[0] || "back";
  return role === ROLES.ADMIN ? <AdminOverview name={name} /> : <VendorOverview name={name} />;
}
