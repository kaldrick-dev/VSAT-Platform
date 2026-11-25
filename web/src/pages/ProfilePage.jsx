import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, Chip, Dropdown, EmptyState, Field, Icon, Page, PageHeader, fieldClass } from "../components/ui.jsx";
import { TRADES } from "../data/workspace.js";
import { useApi } from "../hooks/useApi.js";
import { ALLOWED_FILE_TYPES, MAX_FILE_BYTES, api, downloadDocument, uploadDocument } from "../lib/api.js";
import { formatDay, formatSize } from "../lib/format.js";

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
  const { data: docs, loading, reload } = useApi(call, []);
  const [kind, setKind] = useState(KINDS[0]);
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef(null);

  function choose(event) {
    const chosen = event.target.files?.[0] ?? null;
    setError("");
    if (chosen && !ALLOWED_FILE_TYPES.includes(chosen.type)) {
      setFile(null);
      setError("Choose a PDF, PNG or JPG file.");
      return;
    }
    if (chosen && chosen.size > MAX_FILE_BYTES) {
      setFile(null);
      setError(`That file is ${formatSize(chosen.size)}. The limit is 4 MB.`);
      return;
    }
    setFile(chosen);
  }

  async function upload(event) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await uploadDocument(file, { kind, name: name.trim() });
      setFile(null);
      setName("");
      if (input.current) input.current.value = "";
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const remove = (id) => api.deleteDocument(id).then(reload).catch((err) => setError(err.message));
  const download = (doc) => downloadDocument(doc).catch((err) => setError(err.message));

  return (
    <Card className="p-6">
      <h2 className="text-[15px] font-semibold">Documents</h2>
      <p className="mt-1 text-[13px] text-mute">Upload a PDF, PNG or JPG (up to 4 MB). Only you and the administrators reviewing your application can open it.</p>
      <ul className="mt-4 grid gap-1">
        {docs.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-sunken/60">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sunken"><Icon name="record" className="size-4" /></span>
            <span className="min-w-0 flex-1 basis-40">
              <span className="block truncate text-[13.5px] font-medium">{d.name}</span>
              <span className="block truncate text-xs text-mute">{d.fileName ? `${d.fileName} · ${formatSize(d.size)} · ` : ""}Added {formatDay(d.createdAt)}</span>
            </span>
            <Chip tone="idle">{d.kind}</Chip>
            <span className="flex gap-2">
              {d.fileName
                ? <Button variant="secondary" size="sm" onClick={() => download(d)}>Download</Button>
                : <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-full px-4 text-[13px] underline underline-offset-2 sm:h-8">Open link</a>}
              <Button variant="ghost" size="sm" onClick={() => remove(d.id)}>Remove</Button>
            </span>
          </li>
        ))}
      </ul>
      {!docs.length && <EmptyState loading={loading} title="No documents yet">Upload your ID and trading licence so reviews are quick.</EmptyState>}

      <form className="mt-4 grid gap-3 border-t border-line pt-4" onSubmit={upload}>
        <Field label="File" hint="PDF, PNG or JPG, up to 4 MB">
          <input ref={input} type="file" required accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={choose}
            className="block w-full cursor-pointer rounded-xl bg-surface text-[13px] text-mute ring-[0.5px] ring-ink/25 file:mr-3 file:h-10 file:cursor-pointer file:rounded-xl file:border-0 file:bg-sunken file:px-4 file:text-[13px] file:font-medium file:text-ink" />
        </Field>
        {file && <p className="text-[13px] text-mute">{file.name} · {formatSize(file.size)}</p>}
        <Field label="Type"><Dropdown label="Type" value={kind} onChange={setKind} options={KINDS.map((k) => [k, k])} /></Field>
        <Field label="Name (optional)" hint="Shown to the reviewer. Defaults to the file name."><input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="e.g. Trading licence 2026" /></Field>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy || !file}>{busy ? "Uploading…" : "Upload document"}</Button>
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
