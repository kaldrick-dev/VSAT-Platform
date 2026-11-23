import { useEffect, useMemo, useState } from "react";
import { SitesMap } from "./SitesMap.jsx";
import { SitePreview } from "./SitePreview.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { Button, Chip, Dropdown, EmptyState, Eyebrow, Field, Float, Icon, Segmented, StatusChip, fieldClass } from "./ui.jsx";
import { api } from "../lib/api.js";
import { useSites } from "../hooks/useSites.js";
import { districts, formatRwf } from "../data/sites.js";

const LEGEND = [
  ["Available", "bg-[#22c55e]"],
  ["Allocated", "bg-[#3b82f6]"],
  ["Inactive", "bg-[#4b5563]"]
];

function useIsWide() {
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = (event) => setWide(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return wide;
}

function SiteRow({ site, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(site)}
      aria-current={selected}
      className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition ${selected ? "bg-sunken" : "hover:bg-sunken"}`}
    >
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${selected ? "bg-ink text-surface" : "bg-sunken text-ink"}`}>
        <Icon name={site.status === "available" ? "store" : site.status === "allocated" ? "check" : "minus"} className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium">{site.name}</span>
        <span className="mt-0.5 block truncate text-xs text-mute">{site.sector}, {site.district} · {site.size}</span>
      </span>
      <span className="grid shrink-0 justify-items-end gap-1">
        <span className="text-[13px] font-medium tabular-nums">{(site.fee / 1000).toFixed(0)}k</span>
        <StatusChip status={site.status} />
      </span>
    </button>
  );
}

function SiteDetail({ site, onClose, onApply }) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setExpanded(false), [site.id]);

  return (
    <Float className="absolute inset-x-3 bottom-3 z-20 p-3 shadow-float sm:inset-x-auto sm:bottom-auto sm:right-3 sm:top-3 sm:w-[336px]" as="article" aria-label={`${site.name} details`}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close site details"
        className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-surface shadow-card transition hover:bg-sunken"
      >
        <Icon name="close" className="size-3.5" />
      </button>

      <div className="hidden rounded-2xl bg-sunken pt-2 sm:block">
        <SitePreview site={site} />
      </div>

      <div className="px-2 pb-1 pt-4 sm:text-center">
        <div className="flex items-center gap-2 sm:justify-center">
          <StatusChip status={site.status} />
          <Eyebrow>{site.reference}</Eyebrow>
        </div>
        <h2 className="mt-2.5 text-[17px] font-semibold leading-snug tracking-[-0.01em]">{site.name}</h2>
        <p className="mt-0.5 text-[13px] text-mute">{site.sector}, {site.district} · {site.type}</p>

        <p className="mt-5 text-[13px] text-mute">Published monthly fee</p>
        <p className="mt-0.5 text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{formatRwf(site.fee)}</p>
      </div>

      <div className="mt-4 px-1">
        {site.status === "available" ? (
          <Button size="lg" onClick={() => onApply(site)}>
            <Icon name="clock" className="size-4" />
            Apply · {site.queue} ahead
          </Button>
        ) : (
          <Button size="lg" to="/records">
            View public record
            <Icon name="arrow" className="size-4" />
          </Button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="mx-auto mt-3 flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] text-mute transition hover:text-ink"
      >
        {expanded ? "Show less" : "Show more"}
        <Icon name="chevron" className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="mx-1 mb-2 mt-1 grid gap-3 border-t border-line pt-4">
          <dl className="grid grid-cols-2 gap-3">
            <div><Eyebrow>Site size</Eyebrow><dd className="mt-1 text-[13.5px] font-medium">{site.size}</dd></div>
            <div><Eyebrow>Applicants</Eyebrow><dd className="mt-1 text-[13.5px] font-medium">{site.queue}</dd></div>
          </dl>
          <div>
            <Eyebrow>Published terms</Eyebrow>
            <p className="mt-1 text-[13px] leading-relaxed text-mute">{site.terms}</p>
          </div>
        </div>
      )}
    </Float>
  );
}

function ApplicationDialog({ site, onClose }) {
  const { role } = useAuth();
  const [statement, setStatement] = useState("");
  const [position, setPosition] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (role !== "vendor") return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.applyToSite(site.id, { statement: statement || undefined });
      setPosition(data.queuePosition);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-title"
        className="relative grid w-full max-w-md gap-5 rounded-[26px] bg-surface p-6 shadow-float"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <button type="button" onClick={onClose} aria-label="Close application" className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-sunken transition hover:bg-line">
          <Icon name="close" className="size-3.5" />
        </button>

        <div className="pr-10">
          <Chip tone="good">Timestamped application</Chip>
          <h2 id="application-title" className="mt-3 text-xl font-semibold tracking-[-0.015em]">Apply for {site.name}</h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-mute">
            Your submission time sets your place in the public queue. <strong className="font-medium text-ink">{site.queue} applicants</strong> are ahead of you.
          </p>
        </div>

        <Field label="Why is this site suitable for your trade?">
          <textarea
            autoFocus
            rows="4"
            value={statement}
            onChange={(event) => setStatement(event.target.value)}
            placeholder="Briefly describe what you sell and how you will use the space."
            className={`${fieldClass} h-auto resize-y py-2.5`}
          />
        </Field>

        <div className="flex items-center justify-between rounded-2xl bg-sunken px-4 py-3 text-[13.5px]">
          <span className="text-mute">Published fee</span>
          <strong className="font-medium tabular-nums">{formatRwf(site.fee)} / month</strong>
        </div>
        {error && <p role="alert" className="text-center text-[13px] text-red-600">{error}</p>}

        <div className="grid gap-2.5">
          {role === "vendor" ? (
            <Button size="lg" type="submit" disabled={busy || position !== null}>
              {position !== null ? `Submitted: you are #${position} in the queue` : busy ? "Submitting…" : "Submit application"}
              <Icon name="arrow" className="size-4" />
            </Button>
          ) : role === "admin" ? (
            <p className="rounded-2xl bg-sunken px-4 py-3 text-center text-[13px] text-mute">Administrators cannot apply for sites.</p>
          ) : (
            <Button size="lg" to="/login?next=/%23map">
              Sign in to submit
              <Icon name="arrow" className="size-4" />
            </Button>
          )}
          <p className="text-center text-xs text-faint">No payment is collected on this platform.</p>
        </div>
      </form>
    </div>
  );
}

/** Interactive site registry map with filters, list and detail. Used on the public home page. */
export default function SitesExplorer({ query = "", fill = false }) {
  const wide = useIsWide();
  const { sites, loading, error } = useSites();
  const [status, setStatus] = useState("all");
  const [district, setDistrict] = useState("all");
  const [selectedSite, setSelectedSite] = useState(null);
  const [applicationSite, setApplicationSite] = useState(null);
  const [showList, setShowList] = useState(wide);

  const filteredSites = useMemo(() => {
    const term = query.trim().toLowerCase();
    return sites.filter((site) => {
      const matchesSearch = !term || `${site.name} ${site.district} ${site.sector} ${site.type}`.toLowerCase().includes(term);
      return matchesSearch && (status === "all" || site.status === status) && (district === "all" || site.district === district);
    });
  }, [district, query, sites, status]);

  const counts = useMemo(() => {
    const result = { all: sites.length, available: 0, allocated: 0, inactive: 0 };
    sites.forEach((site) => { result[site.status] += 1; });
    return result;
  }, [sites]);

  useEffect(() => {
    if (selectedSite && !filteredSites.some((site) => site.id === selectedSite.id)) setSelectedSite(null);
  }, [filteredSites, selectedSite]);

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === "Escape") setApplicationSite(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function select(site) {
    setSelectedSite(site);
    if (!wide) setShowList(false);
  }

  return (
    <section aria-label="Vending site map" className={fill
        ? "relative h-full min-h-[520px] overflow-hidden"
        : "relative h-[720px] max-h-[88dvh] min-h-[560px] overflow-hidden rounded-[24px] bg-frame text-ink shadow-[inset_0_0_0_1px_rgba(11,12,14,.1)]"}>
      <SitesMap
        sites={filteredSites}
        selectedSite={selectedSite}
        onSelectSite={select}
        shiftControls={Boolean(selectedSite)}
        padding={wide ? { left: showList ? 360 : 0, right: selectedSite ? 360 : 0, top: 0, bottom: 0 } : { left: 0, right: 0, top: 0, bottom: selectedSite ? 300 : 0 }}
      />

      {/* Filters */}
      <div className="absolute inset-x-3 top-3 z-10 flex flex-wrap items-center gap-2 sm:right-[360px]">
        <Segmented
          label="Filter by status"
          value={status}
          onChange={setStatus}
          className="shrink-0 bg-surface shadow-card"
          options={[["all", "All", counts.all], ["available", "Available", counts.available], ["allocated", "Allocated", counts.allocated], ["inactive", "Inactive", counts.inactive]]}
        />
        <Dropdown
          label="District"
          value={district}
          onChange={setDistrict}
          className="w-[170px] shrink-0"
          buttonClassName="h-9 shadow-card"
          options={[["all", "All districts"], ...districts.map((name) => [name, name])]}
        />
        <button
          type="button"
          onClick={() => setShowList((value) => !value)}
          aria-pressed={showList}
          className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-surface px-4 text-[13px] font-medium shadow-card transition hover:bg-sunken"
        >
          <Icon name="list" />
          {showList ? "Hide list" : "List"}
        </button>
      </div>

      {/* Results list */}
      {showList && (
        <Float as="section" aria-label="Vending site results" className="absolute bottom-3 left-3 top-[64px] z-10 flex w-[340px] max-w-[calc(100%-1.5rem)] flex-col shadow-float max-sm:right-3 max-sm:w-auto">
          <div className="flex items-baseline justify-between px-5 pb-2 pt-4">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{filteredSites.length} {filteredSites.length === 1 ? "site" : "sites"}</h2>
            <Eyebrow>Updated today</Eyebrow>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {filteredSites.map((site) => (
              <SiteRow key={site.id} site={site} selected={selectedSite?.id === site.id} onSelect={select} />
            ))}
            {!filteredSites.length && <EmptyState title={error ? "Could not load sites" : loading ? "Loading sites…" : "No matching sites"}>{error || (loading ? "One moment." : "Try a different district or status.")}</EmptyState>}
          </div>
        </Float>
      )}

      {selectedSite && <SiteDetail site={selectedSite} onClose={() => setSelectedSite(null)} onApply={setApplicationSite} />}

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-3 left-[372px] z-10 hidden items-center gap-4 rounded-full bg-surface px-4 py-2 text-xs font-medium shadow-card xl:flex">
        {LEGEND.map(([label, swatch]) => (
          <span key={label} className="flex items-center gap-2 text-mute">
            <span className={`size-3 rounded-[3px] ${swatch}`} />
            {label}
          </span>
        ))}
      </div>

      {applicationSite && <ApplicationDialog site={applicationSite} onClose={() => setApplicationSite(null)} />}
    </section>
  );
}
