import { useCallback, useEffect, useState } from "react";
import { Button, Card, Chip, Dropdown, EmptyState, Field, Icon, Page, PageHeader, fieldClass } from "../components/ui.jsx";
import { TRADES } from "../data/workspace.js";
import { useApi } from "../hooks/useApi.js";
import { api } from "../lib/api.js";
import { formatDay } from "../lib/format.js";

const KINDS = ["National ID", "Trading licence", "Proof of residence", "Other"];

function DetailsCard() {
  const call = useCallback(() => api.profile().then((res) => res.data), []);
  const { data: profile } = useApi(call);
  const [form, setForm] = useState({ fullName: "", phone: "", trade: TRADES[0] });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (profile) setForm({ fullName: profile.fullName, phone: profile.phone ?? "", trade: profile.trade ?? TRADES[0] });
  }, [profile]);

  const set = (key) => (value) => { setForm({ ...form, [key]: value?.target ? value.target.value : value }); setMessage(""); };

  async function save(event) {
    event.preventDefault();
    try {
      await api.updateProfile({ fullName: form.fullName, trade: form.trade, ...(form.phone ? { phone: form.phone } : {}) });
      setMessage("Saved");
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-[15px] font-semibold">Your details</h2>
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={save}>
        <Field label="Full name"><input className={fieldClass} required minLength={2} value={form.fullName} onChange={set("fullName")} autoComplete="name" /></Field>
        <Field label="Email address" hint="Used to sign in. It is never shown publicly."><input className={fieldClass} value={profile?.email ?? ""} readOnly aria-readonly="true" /></Field>
        <Field label="Phone number"><input className={fieldClass} type="tel" minLength={5} value={form.phone} onChange={set("phone")} placeholder="07x xxx xxxx" autoComplete="tel" /></Field>
        <Field label="What you sell">
          <Dropdown label="What you sell" value={form.trade} onChange={set("trade")} options={TRADES.map((t) => [t, t])} />
        </Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <Button type="submit">Save changes</Button>
          <span role="status" className="text-[13px] text-mute">{message}</span>
        </div>
      </form>
    </Card>
  );
}

function DocumentsCard() {
  const call = useCallback(() => api.myDocuments().then((res) => res.data), []);
  const { data: docs, reload } = useApi(call, []);
  const [form, setForm] = useState({ name: "", kind: KINDS[0], url: "" });
  const [error, setError] = useState("");

  async function add(event) {
    event.preventDefault();
    try {
      await api.addDocument(form);
      setForm({ name: "", kind: form.kind, url: "" });
      setError("");
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  const remove = (id) => api.deleteDocument(id).then(reload).catch((err) => setError(err.message));

  return (
    <Card className="p-6">
      <h2 className="text-[15px] font-semibold">Documents</h2>
      <p className="mt-1 text-[13px] text-mute">Only administrators reviewing your application can see these. Add a link to the file (for example a shared drive link).</p>
      <ul className="mt-4 grid gap-1">
        {docs.map((d) => (
          <li key={d.id} className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-sunken/60">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sunken"><Icon name="record" className="size-4" /></span>
            <span className="min-w-0 flex-1">
              <a href={d.url} target="_blank" rel="noreferrer" className="block truncate text-[13.5px] font-medium underline-offset-2 hover:underline">{d.name}</a>
              <span className="block truncate text-xs text-mute">Added {formatDay(d.createdAt)}</span>
            </span>
            <Chip tone="idle">{d.kind}</Chip>
            <Button variant="secondary" size="sm" onClick={() => remove(d.id)}>Remove</Button>
          </li>
        ))}
      </ul>
      {!docs.length && <EmptyState title="No documents yet">Add your ID and trading licence so reviews are quick.</EmptyState>}

      <form className="mt-4 grid gap-3 border-t border-line pt-4" onSubmit={add}>
        <Field label="Document name"><input className={fieldClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Trading licence 2026" /></Field>
        <Field label="Type"><Dropdown label="Type" value={form.kind} onChange={(kind) => setForm({ ...form, kind })} options={KINDS.map((k) => [k, k])} /></Field>
        <Field label="Link to the file"><input className={fieldClass} required type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" /></Field>
        <div className="flex items-center gap-3">
          <Button type="submit">Add document</Button>
          {error && <span role="alert" className="text-[13px] text-red-600">{error}</span>}
        </div>
      </form>
    </Card>
  );
}

export function ProfilePage() {
  return (
    <Page>
      <PageHeader title="Profile & documents" description="Keep your details and documents current so your applications can be reviewed without delay." />
      <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_1fr]">
        <DetailsCard />
        <DocumentsCard />
      </div>
    </Page>
  );
}
