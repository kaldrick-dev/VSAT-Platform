import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Card, Chip, Dropdown, Eyebrow, Field, Icon, MapSkeleton, Page, PageHeader, SkeletonRows, StatStrip, StatusChip, fieldClass } from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { useSites } from "../hooks/useSites.js";
import { districts, formatRwf } from "../data/sites.js";
import { TRADES } from "../data/workspace.js";

const LocationPicker = lazy(() => import("../components/LocationPicker.jsx"));
const EMPTY = { name: "", district: districts[0], sector: "", size: "", fee: "", type: TRADES[0], terms: "", location: null };

const REVOKE_CATEGORIES = [
  ["violation", "Broke the site terms"],
  ["not_used", "Space not used"],
  ["error", "Allocated in error"],
  ["other", "Other"]
];

function RevokeForm({ site, onDone, onCancel }) {
  const [category, setCategory] = useState("violation");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const panel = useRef(null);
  const typed = reason.trim().length;

  useEffect(() => { panel.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, []);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.revokeSite(site.id, { reason: reason.trim(), reasonCategory: category });
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Card ref={panel} className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Revoke the allocation of {site.name}</h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
      <p className="mt-2 text-[13px] text-mute">The vendor is told, the space reopens for applications, and a new <strong className="font-medium text-ink">Revoked</strong> entry is added to the log. The original approval stays as written. The reason category is public; your written reason is not.</p>
      <form className="mt-5 grid gap-4 md:max-w-xl" onSubmit={submit}>
        <Field label="Reason category (published)"><Dropdown label="Reason category" value={category} onChange={setCategory} options={REVOKE_CATEGORIES} /></Field>
        <Field label="Reason (recorded in the log)" hint={`${typed} / 20 characters minimum`}>
          <textarea rows="3" className={`${fieldClass} h-auto resize-y py-2.5`} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. The stall has been empty for three months" />
        </Field>
        {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy || typed < 20}>{busy ? "Revoking…" : "Revoke allocation"}</Button>
          <p className="flex items-center gap-1.5 text-xs text-mute"><Icon name="lock" className="size-3" />This cannot be edited or deleted afterwards.</p>
        </div>
      </form>
    </Card>
  );
}

function RemoveConfirm({ site, onDone, onCancel }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const panel = useRef(null);

  useEffect(() => { panel.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, []);

  async function remove() {
    setBusy(true);
    setError("");
    try {
      await api.removeSite(site.id);
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Card ref={panel} className="p-6">
      <h2 className="text-[15px] font-semibold">Remove {site.name} from the map?</h2>
      <p className="mt-2 max-w-xl text-[13px] text-mute">The space disappears from the map, the site list and the public records. Its past decisions stay in the log, because the log cannot be edited or deleted. A site that is allocated must be revoked first, and one with pending applications needs those decided first.</p>
      {error && <p role="alert" className="mt-3 text-[13px] text-red-600">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={busy} onClick={remove}>{busy ? "Removing…" : "Yes, remove it"}</Button>
        <Button variant="secondary" disabled={busy} onClick={onCancel}>Keep it</Button>
      </div>
    </Card>
  );
}

function AddSiteForm({ onAdd, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const set = (key) => (value) => setForm({ ...form, [key]: value?.target ? value.target.value : value });
  const valid = form.name.trim() && form.sector.trim() && Number(form.size) > 0 && form.fee !== "" && Number(form.fee) >= 0 && form.terms.trim() && form.location;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Add a vending site</h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
      <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (valid) onAdd(form); }}>
        <div className="grid content-start gap-4">
          <Field label="Site name"><input className={fieldClass} required value={form.name} onChange={set("name")} placeholder="e.g. Kimironko Market North" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="District"><Dropdown label="District" value={form.district} onChange={set("district")} options={districts.map((d) => [d, d])} /></Field>
            <Field label="Sector"><input className={fieldClass} required value={form.sector} onChange={set("sector")} /></Field>
            <Field label="Size (m²)"><input className={fieldClass} required type="number" min="1" step="0.5" value={form.size} onChange={set("size")} /></Field>
            <Field label="Monthly fee (RWF)"><input className={fieldClass} required type="number" min="0" step="500" value={form.fee} onChange={set("fee")} /></Field>
          </div>
          <Field label="Permitted trade"><Dropdown label="Permitted trade" value={form.type} onChange={set("type")} options={TRADES.map((t) => [t, t])} /></Field>
          <Field label="Terms" hint="Published exactly as written.">
            <textarea rows="3" required className={`${fieldClass} h-auto resize-y py-2.5`} value={form.terms} onChange={set("terms")} />
          </Field>
        </div>
        <div className="grid content-start gap-3">
          <Eyebrow>Location: click the map</Eyebrow>
          <Suspense fallback={<MapSkeleton className="h-[260px] rounded-2xl" />}>
            <LocationPicker value={form.location} onChange={set("location")} />
          </Suspense>
          <p className="font-mono text-xs text-mute" role="status">{form.location ? `${form.location.latitude}, ${form.location.longitude}` : "No location chosen yet"}</p>
          <Button type="submit" disabled={!valid}>Publish site<Icon name="arrow" className="size-4" /></Button>
        </div>
      </form>
    </Card>
  );
}

export function AdminSitesPage() {
  const [params] = useSearchParams();
  const { sites: list, loading, error: loadError, reload } = useSites();
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(params.get("new") === "1");
  const [revoking, setRevoking] = useState(null);
  const [removing, setRemoving] = useState(null);

  const counts = { available: 0, allocated: 0, inactive: 0 };
  list.forEach((s) => { counts[s.status] += 1; });

  async function add(form) {
    try {
      await api.createSite({
        name: form.name.trim(), district: form.district, sector: form.sector.trim(), type: form.type,
        size: `${form.size} m²`, fee: Number(form.fee), terms: form.terms.trim(),
        latitude: form.location.latitude, longitude: form.location.longitude
      });
      setAdding(false);
      setError("");
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggle(site) {
    try {
      await api.updateSite(site.id, { status: site.status === "inactive" ? "available" : "inactive" });
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Page>
      <PageHeader title="Manage sites" description="Publish new spaces, pause or reopen them, revoke an allocation, or remove a space from the map. Every change is recorded on the public activity log." actions={!adding && <Button onClick={() => setAdding(true)}><Icon name="plus" className="size-4" />Add vending site</Button>} />
      <StatStrip loading={loading} items={[{ label: "Listed", value: list.length }, { label: "Available", value: counts.available, tone: "up" }, { label: "Allocated", value: counts.allocated }, { label: "Paused", value: counts.inactive }]} />
      {(error || loadError) && <p role="alert" className="text-[13px] text-red-600">{error || loadError}</p>}
      {adding && <AddSiteForm onAdd={add} onCancel={() => setAdding(false)} />}
      {removing && <RemoveConfirm site={removing} onCancel={() => setRemoving(null)} onDone={() => { setRemoving(null); setError(""); reload(); }} />}
      {revoking && <RevokeForm site={revoking} onCancel={() => setRevoking(null)} onDone={() => { setRevoking(null); setError(""); reload(); }} />}

      <Card className="overflow-x-auto">
        <ul className="divide-y divide-line md:hidden">
          {list.map((s) => (
            <li key={s.id} className="grid gap-2 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-[14.5px] font-semibold">{s.name}</p><p className="font-mono text-[12px] text-mute">{s.reference}</p></div>
                <StatusChip status={s.status} />
              </div>
              <p className="text-[13px] text-mute">{s.sector}, {s.district} · {s.size} · {s.type}</p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13.5px] font-medium tabular-nums">{formatRwf(s.fee)} / month</span>
                {s.status === "allocated"
                  ? <Button variant="secondary" size="sm" onClick={() => { setAdding(false); setRemoving(null); setRevoking(s); }}>Revoke</Button>
                  : <span className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => toggle(s)}>{s.status === "inactive" ? "Reopen" : "Pause"}</Button><Button variant="ghost" size="sm" onClick={() => { setAdding(false); setRevoking(null); setRemoving(s); }}>Remove</Button></span>}
              </div>
            </li>
          ))}
          {!list.length && <li>{loading ? <SkeletonRows rows={3} /> : <p className="px-4 py-6 text-center text-[13px] text-mute">No sites yet.</p>}</li>}
        </ul>
        <table className="hidden w-full min-w-[720px] border-collapse text-left md:table">
          <caption className="sr-only">Vending sites</caption>
          <thead><tr className="border-b border-line">{["Reference", "Site", "Fee", "Status", ""].map((h, i) => <th key={i} scope="col" className="px-5 py-3"><Eyebrow>{h}</Eyebrow></th>)}</tr></thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="border-t border-line first:border-t-0 hover:bg-sunken/50">
                <th scope="row" className="px-5 py-3.5 font-mono text-[12.5px] font-medium">{s.reference}</th>
                <td className="px-5 py-3.5"><span className="block text-[13.5px] font-medium">{s.name}</span><span className="block text-xs text-mute">{s.sector}, {s.district} · {s.size} · {s.type}</span></td>
                <td className="px-5 py-3.5 text-[13px] tabular-nums">{formatRwf(s.fee)}</td>
                <td className="px-5 py-3.5"><StatusChip status={s.status} /></td>
                <td className="px-5 py-3.5 text-right">
                  {s.status === "allocated"
                    ? <Button variant="secondary" size="sm" onClick={() => { setAdding(false); setRemoving(null); setRevoking(s); }}>Revoke</Button>
                    : <span className="inline-flex gap-2"><Button variant="secondary" size="sm" onClick={() => toggle(s)}>{s.status === "inactive" ? "Reopen" : "Pause"}</Button><Button variant="ghost" size="sm" onClick={() => { setAdding(false); setRevoking(null); setRemoving(s); }}>Remove</Button></span>}
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan="5" className="text-center text-[13px] text-mute">{loading ? <SkeletonRows rows={4} /> : <span className="block px-5 py-6">No sites yet.</span>}</td></tr>}
          </tbody>
        </table>
      </Card>
    </Page>
  );
}
