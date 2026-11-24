import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Card, Chip, Dropdown, EmptyState, Eyebrow, Field, Icon, Page, PageHeader, PageSkeleton, StatusChip, fieldClass } from "../components/ui.jsx";
import { formatRwf } from "../data/sites.js";
import { TRADES } from "../data/workspace.js";
import { useApi } from "../hooks/useApi.js";
import { api } from "../lib/api.js";
import { formatDateTime } from "../lib/format.js";

const EXPERIENCE = ["Less than a year", "1 to 3 years", "3 to 5 years", "More than 5 years"];
const MAX_USE = 600;

const buildStatement = ({ trade, experience, use }) =>
  [`What I sell: ${trade}`, `Time trading: ${experience}`, `How I will use the space: ${use.trim()}`].join("\n");

function SiteSummary({ site }) {
  return (
    <Card className="order-first p-6 lg:sticky lg:top-6 lg:order-none">
      <div className="flex items-center gap-2">
        <StatusChip status={site.status} />
        <Eyebrow>{site.reference}</Eyebrow>
      </div>
      <h2 className="mt-3 text-lg font-semibold tracking-[-0.01em]">{site.name}</h2>
      <p className="text-[13px] text-mute">{site.sector}, {site.district} · {site.type} · {site.size}</p>
      <dl className="mt-5 grid gap-4 text-[13.5px]">
        <div><Eyebrow>Published monthly fee</Eyebrow><dd className="mt-1 text-[22px] font-semibold tabular-nums">{formatRwf(site.fee)}</dd></div>
        <div><Eyebrow>People already waiting</Eyebrow><dd className="mt-1 font-medium">{site.queue}</dd></div>
        <div><Eyebrow>Published terms</Eyebrow><dd className="mt-1 leading-relaxed text-mute">{site.terms}</dd></div>
      </dl>
      <p className="mt-5 text-xs text-faint">No payment is collected on this platform.</p>
    </Card>
  );
}

function Submitted({ site, position }) {
  return (
    <Card className="p-8 text-center">
      <Chip tone="good">Application received</Chip>
      <h2 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">You are #{position} in the queue</h2>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-mute">
        Your application for {site.name} is timestamped and public queue order is fixed by that time. You will be notified when an administrator decides.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button to="/vendor">Track my applications<Icon name="arrow" className="size-4" /></Button>
        <Button variant="secondary" to="/sites">Back to the map</Button>
      </div>
    </Card>
  );
}

function ApplicationForm({ site, profile, documents, onSubmitted }) {
  const [form, setForm] = useState({ trade: TRADES[0], experience: EXPERIENCE[0], use: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (profile?.trade) setForm((old) => ({ ...old, trade: profile.trade }));
  }, [profile]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.applyToSite(site.id, { statement: buildStatement(form) });
      onSubmitted(data.queuePosition);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <form className="grid gap-6" onSubmit={submit}>
        <section className="grid gap-4">
          <h2 className="text-[15px] font-semibold">1. About you</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Applicant"><input className={fieldClass} value={profile?.fullName ?? ""} readOnly aria-readonly="true" /></Field>
            <Field label="Phone" hint={profile?.phone ? undefined : "Add a phone number in your profile so you can be reached."}>
              <input className={fieldClass} value={profile?.phone ?? ""} readOnly aria-readonly="true" placeholder="Not provided" />
            </Field>
          </div>
          <p className="text-xs text-mute">These come from your <Link to="/profile" className="underline underline-offset-2">profile</Link>. Update them there first if they are out of date.</p>
        </section>

        <section className="grid gap-4">
          <h2 className="text-[15px] font-semibold">2. Your trade</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="What you sell"><Dropdown label="What you sell" value={form.trade} onChange={(trade) => setForm({ ...form, trade })} options={TRADES.map((t) => [t, t])} /></Field>
            <Field label="How long you have traded"><Dropdown label="How long you have traded" value={form.experience} onChange={(experience) => setForm({ ...form, experience })} options={EXPERIENCE.map((e) => [e, e])} /></Field>
          </div>
          <Field label="How will you use this space?" hint={`${form.use.length} / ${MAX_USE}. Say what you will sell, your usual hours and how you will keep the space tidy.`}>
            <textarea
              required
              minLength={20}
              maxLength={MAX_USE}
              rows="6"
              value={form.use}
              onChange={(event) => setForm({ ...form, use: event.target.value })}
              placeholder="e.g. I sell fresh vegetables six days a week from 6am to 2pm. I would keep the stall clean and remove my crates each evening."
              className={`${fieldClass} h-auto resize-y py-2.5`}
            />
          </Field>
        </section>

        <section className="grid gap-3">
          <h2 className="text-[15px] font-semibold">3. Your documents</h2>
          {documents.length ? (
            <p className="text-[13.5px] text-mute">{documents.length} document(s) on file: {documents.map((d) => d.kind).join(", ")}. Administrators can see these while reviewing.</p>
          ) : (
            <p className="rounded-xl bg-warn-soft px-4 py-3 text-[13px] text-warn">You have not added any documents. Applications without documents usually take longer to review. <Link to="/profile" className="underline underline-offset-2">Add them in your profile</Link>, then come back.</p>
          )}
        </section>

        <section className="grid gap-3">
          <h2 className="text-[15px] font-semibold">4. Confirm</h2>
          <label className="flex items-start gap-2.5 text-[13.5px]">
            <input type="checkbox" className="mt-0.5 size-5 shrink-0" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
            <span>I have read the published terms and fee for this site and the details above are true. I understand my place in the queue is set by the time I submit.</span>
          </label>
          {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="sm" disabled={busy || !agreed || form.use.trim().length < 20}>
              {busy ? "Submitting…" : "Submit application"}<Icon name="arrow" className="size-4" />
            </Button>
            <Button variant="secondary" size="sm" to="/sites">Cancel</Button>
          </div>
        </section>
      </form>
    </Card>
  );
}

/** Full-page application form for one site, replacing the old map dialog. */
export function ApplyPage() {
  const { id } = useParams();
  const [position, setPosition] = useState(null);
  const load = useCallback(() => Promise.all([api.getSite(id), api.myApplications(), api.profile(), api.myDocuments()])
    .then(([site, applications, profile, documents]) => ({ site: site.data, existing: applications.data.find((a) => a.siteId === id && a.status === "pending") ?? null, profile: profile.data, documents: documents.data })), [id]);
  const { data, error } = useApi(load, null);

  if (error) return <Page><EmptyState title="Could not open this application">{error}</EmptyState></Page>;
  if (!data) return <PageSkeleton />;

  const { site, existing, profile, documents } = data;
  const body = position !== null
    ? <Submitted site={site} position={position} />
    : existing
      ? <EmptyState title="You already applied for this site">Applied {formatDateTime(existing.appliedAt)}. <Link to="/vendor" className="underline underline-offset-2">Track it here</Link>.</EmptyState>
      : site.status !== "available"
        ? <EmptyState title="This site is not accepting applications">It is {site.status === "allocated" ? "already allocated" : "paused"}. <Link to="/records" className="underline underline-offset-2">See the public record</Link>.</EmptyState>
        : <ApplicationForm site={site} profile={profile} documents={documents} onSubmitted={setPosition} />;

  return (
    <Page>
      <PageHeader title={`Apply for ${site.name}`} description="Fill in the form below. Your submission time sets your place in the public queue." actions={<Button variant="secondary" to="/sites">Back to the map</Button>} />
      <div className="grid items-start gap-5 lg:grid-cols-[1.5fr_1fr]">
        {body}
        <SiteSummary site={site} />
      </div>
    </Page>
  );
}
