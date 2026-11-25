import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Button, Chip, Eyebrow, Icon, Page, PageHeader, Ring, Skeleton, SkeletonRows } from "../components/ui.jsx";
import { formatRwf } from "../data/sites.js";
import { useSites } from "../hooks/useSites.js";
import { useApi } from "../hooks/useApi.js";
import { api } from "../lib/api.js";
import { formatDateTime } from "../lib/format.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { useNotifications } from "../hooks/useNotifications.js";
import { ROLES } from "../lib/access.js";

const TONE = { up: "text-good", down: "text-bad", flat: "text-faint" };

/** Soft tinted card: no border, no shadow. The page is white, so the tint does the separating. */
function Tile({ label, value, delta, tone = "flat", highlight = false, loading = false }) {
  return (
    <div className={`p-5`}>
      <p className={`text-[13px] ${highlight ? "text-accent" : "text-mute"}`}>{label}</p>
      <p className="mt-2 flex items-baseline gap-2">
        {loading
          ? <Skeleton className="h-[34px] w-14" />
          : <span className={`text-[34px] font-semibold leading-none tracking-[-0.03em] tabular-nums ${highlight ? "text-accent" : ""}`}>{value}</span>}
        {!loading && delta && <span className={`text-xs font-medium ${TONE[tone]}`}>{delta}</span>}
      </p>
    </div>
  );
}

function Tiles({ children }) {
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>;
}

function Panel({ title, description, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl p-2 ${className}`}>
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
  const { items, loading } = useNotifications();
  return (
    <Panel title="Recent updates" action={<Button variant="ghost" size="sm" to="/notifications">View all</Button>}>
      {items.slice(0, 3).map((n) => (
        <Row key={n.id} to="/notifications"
          primary={<>{!n.read && <span className="mr-2 inline-block size-1.5 rounded-full bg-accent align-middle" />}{n.title}</>}
          secondary={n.time} end={<Go />} />
      ))}
      {!items.length && (loading ? <SkeletonRows rows={2} /> : <p className="px-3.5 py-3 text-[13px] text-mute">Nothing new.</p>)}
    </Panel>
  );
}

function OpenSpaces({ title }) {
  const { sites, loading } = useSites();
  const OPEN = sites.filter((site) => site.status === "available");
  return (
    <Panel title={title} description={OPEN.length === 1 ? "1 space is accepting applications." : `${OPEN.length} spaces are accepting applications.`} action={<Button variant="ghost" size="sm" to="/sites">Open map</Button>}>
      <div className="overflow-x-auto rounded-xl bg-surface">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Vending spaces open for applications</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="px-4 py-2.5"><Eyebrow className="text-mute">Space</Eyebrow></th>
              <th scope="col" className="hidden px-4 py-2.5 2xl:table-cell"><Eyebrow className="text-mute">Location</Eyebrow></th>
              <th scope="col" className="hidden whitespace-nowrap px-4 py-2.5 sm:table-cell"><Eyebrow className="text-mute">Size</Eyebrow></th>
              <th scope="col" className="hidden whitespace-nowrap px-4 py-2.5 text-right sm:table-cell"><Eyebrow className="text-mute">Fee / month</Eyebrow></th>
              <th scope="col" className="px-4 py-2.5"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {OPEN.map((site) => (
              <tr key={site.id} className="border-b border-line last:border-b-0 transition hover:bg-sunken/60">
                <th scope="row" className="px-4 py-3 text-left font-normal">
                  <span className="block text-[13.5px] font-medium">{site.name}</span>
                  <span className="mt-0.5 block text-xs text-mute">{site.reference}<span className="2xl:hidden"> · {site.sector}, {site.district}</span><span className="block font-medium text-ink sm:hidden">{formatRwf(site.fee)} / month</span></span>
                </th>
                <td className="hidden px-4 py-3 text-[13px] text-mute 2xl:table-cell">{site.sector}, {site.district}</td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-[13px] text-mute sm:table-cell">{site.size}</td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-right text-[13px] font-medium tabular-nums sm:table-cell">{formatRwf(site.fee)}</td>
                <td className="px-4 py-3 text-right"><Button variant="secondary" size="sm" to={`/sites/${site.id}/apply`}>Apply</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!OPEN.length && (loading ? <SkeletonRows rows={2} /> : <p className="px-4 py-3 text-[13px] text-mute">No spaces are open right now.</p>)}
      </div>
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
  const { sites, loading: loadingSites } = useSites();
  const OPEN = sites.filter((site) => site.status === "available");
  const { data: applications, loading: loadingApplications } = useApi(useCallback(() => api.myApplications().then((res) => res.data), []), []);
  const { data: flags, loading: loadingFlags } = useApi(useCallback(() => api.myFlags().then((res) => res.data), []), []);
  const pending = applications.filter((a) => a.status === "pending");
  const application = pending[0];
  const openFlags = flags.filter((f) => f.status === "open").length;
  return (
    <Page>
      <PageHeader title={`Welcome, ${name}`} description="Your applications, your place in each queue and the spaces open right now." actions={<Button to="/sites">Browse sites<Icon name="arrow" className="size-4" /></Button>} />

      <Tiles>
        <Tile loading={loadingApplications} label="Active applications" value={pending.length} />
        <Tile loading={loadingApplications} label="Queue position" value={application ? `#${application.queuePosition}` : "-"} delta={application ? application.site.name : "no pending application"} highlight />
        <Tile loading={loadingSites} label="Open spaces" value={OPEN.length} delta="to apply for" tone="up" />
        <Tile loading={loadingFlags} label="My flags open" value={openFlags} delta={openFlags ? "awaiting review" : "-"} />
      </Tiles>

      <div className="grid items-start gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="grid gap-4">
          <Panel title="Your application" action={<Button variant="ghost" size="sm" to="/vendor">Details</Button>}>
            {application ? (
              <div className="flex flex-wrap items-center gap-5 rounded-xl bg-surface p-4">
                <Ring value={1 / application.queuePosition} size={84} stroke={7} label={`Position ${application.queuePosition}`}>
                  <span>
                    <span className="block text-[24px] font-semibold tabular-nums tracking-[-0.03em]">{application.queuePosition}</span>
                    <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.08em] text-faint">in queue</span>
                  </span>
                </Ring>
                <div className="min-w-0 flex-1">
                  <Chip tone="warn">Pending review</Chip>
                  <p className="mt-2 text-[15px] font-semibold">{application.site.name}</p>
                  <p className="text-[13px] text-mute">{application.site.district} · applied {formatDateTime(application.appliedAt)}</p>
                </div>
              </div>
            ) : loadingApplications ? (
              <SkeletonRows rows={1} />
            ) : (
              <p className="rounded-xl bg-surface p-4 text-[13px] text-mute">You have no pending application. Open the map to apply for a space.</p>
            )}
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
  const { sites, loading: loadingSites } = useSites();
  const call = useCallback(() => Promise.all([api.listApplications({ status: "pending" }), api.listFlags({ status: "open" })])
    .then(([applications, flags]) => ({ queue: applications.data, openFlags: flags.data })), []);
  const { data: { queue, openFlags }, loading } = useApi(call, { queue: [], openFlags: [] });
  const counts = { available: 0, allocated: 0, inactive: 0 };
  sites.forEach((s) => { counts[s.status] += 1; });
  const noDocs = queue.filter((a) => !a.vendor._count.documents).length;
  return (
    <Page>
      <PageHeader title={`Welcome, ${name}`} description="What needs your attention: the oldest applications, open flags and the state of every listed space." actions={<Button to="/admin">Review queue<Icon name="arrow" className="size-4" /></Button>} />

      <Tiles>
        <Tile loading={loading} label="Pending applications" value={queue.length} delta={noDocs ? `${noDocs} without documents` : undefined} tone="down" />
        <Tile loading={loadingSites} label="Open spaces" value={counts.available} delta={`of ${sites.length} listed`} tone="up" />
        <Tile loading={loadingSites} label="Allocated" value={counts.allocated} />
        <Tile loading={loading} label="Flags awaiting review" value={openFlags.length} tone={openFlags.length ? "down" : "flat"} />
      </Tiles>

      <div className="grid items-start gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="grid gap-4">
          <Panel title="Oldest pending applications" description="Positions are fixed by submission time." action={<Button variant="ghost" size="sm" to="/admin">Open queue</Button>}>
            <div className="overflow-x-auto rounded-xl bg-surface">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">Oldest pending applications</caption>
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="px-4 py-2.5"><Eyebrow className="text-mute">#</Eyebrow></th>
                    <th scope="col" className="px-4 py-2.5"><Eyebrow className="text-mute">Space</Eyebrow></th>
                    <th scope="col" className="hidden whitespace-nowrap px-4 py-2.5 2xl:table-cell"><Eyebrow className="text-mute">Applied</Eyebrow></th>
                    <th scope="col" className="hidden px-4 py-2.5 sm:table-cell"><Eyebrow className="text-mute">Documents</Eyebrow></th>
                    <th scope="col" className="px-4 py-2.5"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {queue.slice(0, 4).map((a) => (
                    <tr key={a.id} className="border-b border-line transition last:border-b-0 hover:bg-sunken/60">
                      <td className="px-4 py-3"><span className="grid size-7 place-items-center rounded-lg bg-sunken font-mono text-[12px] font-medium" title="Position in this site's queue">{a.queuePosition}</span></td>
                      <th scope="row" className="px-4 py-3 text-left font-normal">
                        <span className="block text-[13.5px] font-medium">{a.site.name}</span>
                        <span className="mt-0.5 block text-xs text-mute">{a.vendor.fullName}<span className="2xl:hidden"> · {formatDateTime(a.appliedAt)}</span><span className={`block font-medium sm:hidden ${a.vendor._count.documents ? "text-good" : "text-bad"}`}>{a.vendor._count.documents ? "Documents attached" : "No documents"}</span></span>
                      </th>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-[13px] text-mute 2xl:table-cell">{formatDateTime(a.appliedAt)}</td>
                      <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell"><Chip tone={a.vendor._count.documents ? "good" : "bad"}>{a.vendor._count.documents ? "Attached" : "None"}</Chip></td>
                      <td className="px-4 py-3 text-right"><Button variant="secondary" size="sm" to="/admin">Review</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!queue.length && (loading ? <SkeletonRows rows={2} /> : <p className="px-4 py-3 text-[13px] text-mute">No applications are waiting.</p>)}
            </div>
          </Panel>
          <RecentUpdates role="admin" />
        </div>
        <div className="grid gap-4">
          <Panel title="Flags awaiting review" action={<Button variant="ghost" size="sm" to="/admin/flags">Review</Button>}>
            {openFlags.length ? openFlags.map((f) => (
              <Row key={f.id} to="/admin/flags" primary={f.category} secondary={`${f.allocation.site.name} · raised ${formatDateTime(f.createdAt)}`} end={<Chip tone="warn">Open</Chip>} />
            )) : <p className="px-3.5 py-3 text-[13px] text-mute">No flags are waiting.</p>}
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

function AssociationOverview({ name, organisation }) {
  const { data: flags, loading } = useApi(useCallback(() => api.myFlags().then((res) => res.data), []), []);
  const open = flags.filter((f) => f.status === "open").length;
  const answered = flags.filter((f) => f.status !== "open").length;
  return (
    <Page>
      <PageHeader title={`Welcome, ${name}`} description={organisation ? `Representing ${organisation}. Read the allocation record and flag anything that broke the published rules.` : "Read the allocation record and flag anything that broke the published rules."} actions={<Button to="/flags">Flag an allocation<Icon name="arrow" className="size-4" /></Button>} />

      <Tiles>
        <Tile loading={loading} label="Flags raised" value={flags.length} />
        <Tile loading={loading} label="Awaiting an answer" value={open} tone={open ? "down" : "flat"} />
        <Tile loading={loading} label="Answered" value={answered} />
      </Tiles>

      <div className="grid items-start gap-4 lg:grid-cols-[1.25fr_1fr]">
        <RecentUpdates role="association" />
        <QuickActions items={[
          ["/flags", "Flag an allocation", "Report a decision that broke the rules"],
          ["/records", "Read the allocation record", "Decisions, queue order and flags"],
          ["/sites", "Open the site map", "Check locations and status"]
        ]} />
      </div>
    </Page>
  );
}

/** The workspace's own home: an overview that adapts to the signed-in role. */
export function WorkspacePage() {
  const { user, role } = useAuth();
  const name = (user?.name ?? user?.email ?? "").split(" ")[0] || "back";
  if (role === ROLES.ADMIN) return <AdminOverview name={name} />;
  if (role === ROLES.ASSOCIATION) return <AssociationOverview name={name} organisation={user?.organisation} />;
  return <VendorOverview name={name} />;
}
