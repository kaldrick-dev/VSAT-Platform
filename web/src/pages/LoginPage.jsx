import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "../components/PublicLayout.jsx";
import { Icon } from "../components/ui.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { api } from "../lib/api.js";
import { HOME_BY_ROLE, safeNext } from "../lib/access.js";
import "../public.css";

const POINTS = [
  "Apply for open spaces and follow your place in the queue",
  "Flag an allocation that did not follow the published rules",
  "Your account never appears on the public record"
];

// Dev only: fills the form with the seeded accounts (npm run db:seed).
const DEMO = {
  vendor: { email: "vendor@example.com", password: "password123" },
  admin: { email: "admin@example.com", password: "password123" }
};

export function LoginPage() {
  const { signIn, isSignedIn, role } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ fullName: "", email: "", password: "", accountType: "vendor", organisation: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const next = safeNext(params.get("next"));
  const landing = (userRole) => next ?? HOME_BY_ROLE[userRole];
  const isRegister = mode === "register";
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  if (isSignedIn) return <Navigate to={landing(role)} replace />;

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { token, user } = isRegister ? await api.register({ fullName: form.fullName, email: form.email, password: form.password, accountType: form.accountType, ...(form.accountType === "association" ? { organisation: form.organisation.trim() } : {}) }) : await api.login({ email: form.email, password: form.password });
      signIn({ token, user });
      navigate(landing(user.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const fillDemo = (kind) => setForm({ ...form, ...DEMO[kind] });

  return (
    <div className="pv pv-login">
      <div className="pv-login-bar">
        <Link to="/" aria-label="VSAT home"><Logo /></Link>
        <Link to="/" className="back"><Icon name="arrow" />Back to site</Link>
      </div>

      <main className="pv-login-grid">
        <section className="pv-login-copy">
          <span className="pv-eyebrow"><i />Vendor accounts</span>
          <h1 className="pv-h1">Apply. Track.<br />Ask the question.</h1>
          <ul>
            {POINTS.map((point) => <li key={point}><i><Icon name="check" /></i>{point}</li>)}
          </ul>
        </section>

        <form className="pv-glass" onSubmit={onSubmit}>
          <div className="pv-tabs" role="tablist" aria-label="Account">
            <button type="button" role="tab" aria-selected={!isRegister} onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
            <button type="button" role="tab" aria-selected={isRegister} onClick={() => { setMode("register"); setError(""); }}>Create account</button>
          </div>

          <h2>{isRegister ? (form.accountType === "association" ? "Create your association account" : "Create your vendor account") : "Welcome back"}</h2>
          <p className="sub">{isRegister ? (form.accountType === "association" ? "Association representatives can read the allocation record and flag allocations. It takes a minute." : "Vendors apply for spaces and follow their queue. It takes a minute.") : "Sign in to continue. You can browse the site map without an account."}</p>

          <div className="pv-form">
            {isRegister && (
              <div className="pv-in">I am a
                <div className="pv-choice" role="group" aria-label="Account type">
                  <button type="button" aria-pressed={form.accountType === "vendor"} onClick={() => setForm({ ...form, accountType: "vendor" })}>Vendor</button>
                  <button type="button" aria-pressed={form.accountType === "association"} onClick={() => setForm({ ...form, accountType: "association" })}>Association representative</button>
                </div>
              </div>
            )}
            {isRegister && form.accountType === "association" && (
              <label className="pv-in">Organisation
                <input required autoComplete="organization" minLength={2} value={form.organisation} onChange={set("organisation")} placeholder="e.g. Kigali Vendors Association" />
              </label>
            )}
            {isRegister && (
              <label className="pv-in">Full name
                <input required autoComplete="name" value={form.fullName} onChange={set("fullName")} placeholder="Your name" />
              </label>
            )}
            <label className="pv-in">Email address
              <input required type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="name@example.com" />
            </label>
            <label className="pv-in">Password
              <input required type="password" minLength={isRegister ? 8 : undefined} autoComplete={isRegister ? "new-password" : "current-password"} value={form.password} onChange={set("password")} placeholder={isRegister ? "At least 8 characters" : "Your password"} />
            </label>

            {error && <p role="alert" className="pv-alert">{error}</p>}

            <button type="submit" className="pv-btn pv-btn-lime" disabled={busy}>
              {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
              <span className="ic"><Icon name="arrow" /></span>
            </button>
          </div>

          {import.meta.env.DEV && (
            <div className="pv-dev">
              <span>Dev only: fill a seeded account</span>
              <div className="pv-row">
                <button type="button" className="pv-btn pv-btn-glass pv-btn-sm" onClick={() => fillDemo("vendor")}>Demo vendor</button>
                <button type="button" className="pv-btn pv-btn-glass pv-btn-sm" onClick={() => fillDemo("admin")}>Demo admin</button>
              </div>
            </div>
          )}
          <p className="pv-foot-note">No payment is collected on this platform.</p>
        </form>
      </main>
    </div>
  );
}
