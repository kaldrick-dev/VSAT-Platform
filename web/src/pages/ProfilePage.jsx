import { useRef, useState } from "react";
import { Button, Card, Chip, Dropdown, Eyebrow, Field, Icon, Page, PageHeader, fieldClass } from "../components/ui.jsx";
import { TRADES, documentsSeed, vendorProfileSeed } from "../data/workspace.js";
import { districts } from "../data/sites.js";
import { useAuth } from "../hooks/useAuth.jsx";

const DOC_TONE = { Verified: "good", Pending: "warn", Missing: "bad" };

export function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ fullName: user?.name ?? "", ...vendorProfileSeed });
  const [saved, setSaved] = useState(false);
  const [docs, setDocs] = useState(documentsSeed);
  const fileRef = useRef(null);
  const [uploadFor, setUploadFor] = useState(null);

  const set = (key) => (value) => { setForm({ ...form, [key]: value?.target ? value.target.value : value }); setSaved(false); };

  function pick(id) { setUploadFor(id); fileRef.current?.click(); }
  function onFile(event) {
    const file = event.target.files?.[0];
    if (file && uploadFor) setDocs((list) => list.map((d) => (d.id === uploadFor ? { ...d, status: "Pending", file: file.name } : d)));
    event.target.value = "";
  }

  return (
    <Page>
      <PageHeader title="Profile & documents" description="Keep your details and documents current so your applications can be reviewed without delay." />
      <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold">Your details</h2>
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setSaved(true); }}>
            <Field label="Full name"><input className={fieldClass} required value={form.fullName} onChange={set("fullName")} autoComplete="name" /></Field>
            <Field label="Email address" hint="Used to sign in. It is never shown publicly."><input className={fieldClass} value={user?.email ?? ""} readOnly aria-readonly="true" /></Field>
            <Field label="Phone number"><input className={fieldClass} type="tel" value={form.phone} onChange={set("phone")} placeholder="07x xxx xxxx" autoComplete="tel" /></Field>
            <Field label="What you sell">
              <Dropdown label="What you sell" value={form.trade} onChange={set("trade")} options={TRADES.map((t) => [t, t])} />
            </Field>
            <Field label="Preferred district">
              <Dropdown label="Preferred district" value={form.district} onChange={set("district")} options={districts.map((d) => [d, d])} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="About your business (optional)">
                <textarea rows="3" className={`${fieldClass} h-auto resize-y py-2.5`} value={form.about} onChange={set("about")} placeholder="Briefly describe what you sell and how you work." />
              </Field>
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Button type="submit">Save changes</Button>
              <span role="status" className="text-[13px] text-good">{saved ? "Saved" : ""}</span>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-[15px] font-semibold">Documents</h2>
          <p className="mt-1 text-[13px] text-mute">Only administrators reviewing your application can see these.</p>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={onFile} aria-label="Choose a document to upload" tabIndex={-1} />
          <ul className="mt-4 grid gap-1">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-sunken/60">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sunken"><Icon name="record" className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium">{d.name}</span>
                  <span className="block truncate text-xs text-mute">{d.file || d.hint}</span>
                </span>
                <Chip tone={DOC_TONE[d.status]}>{d.status}</Chip>
                <Button variant="secondary" size="sm" onClick={() => pick(d.id)}>{d.file ? "Replace" : "Upload"}</Button>
              </li>
            ))}
          </ul>
          <Eyebrow className="mt-4 block">PDF, JPG or PNG</Eyebrow>
        </Card>
      </div>
    </Page>
  );
}
