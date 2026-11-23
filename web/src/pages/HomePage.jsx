import { Suspense, lazy } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DownloadButtons, datasetMeta } from "../components/DocumentActions.jsx";
import { Icon } from "../components/ui.jsx";
import { DATASETS } from "../data/datasets.js";
import { formatDate, statusLog } from "../data/records.js";
import { formatRwf } from "../data/sites.js";
import { useSites } from "../hooks/useSites.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { HOME_BY_ROLE, ROLES } from "../lib/access.js";

// The map pulls in MapLibre, so load it after the hero has painted.
const SitesExplorer = lazy(() => import("../components/SitesExplorer.jsx"));

const buildSteps = (open) => [
  { icon: "map", step: "Step 01", title: "Browse verified sites", body: "See location, availability, fees and terms before you apply. No account needed.", big: `${open}`, unit: "spaces open now" },
  { icon: "clock", step: "Step 02", title: "Apply and track your place", body: "Every application is timestamped, so queue order stays visible and can be checked.", big: "#1", unit: "your place in line, always visible", rec: true },
  { icon: "record", step: "Step 03", title: "Check every outcome", body: "Every listing and allocation is dated on the public log. Nothing is edited, and applicant details stay private.", big: `${statusLog.length}`, unit: "entries on the public log" }
];

const ROLES_INFO = [
  { icon: "search", name: "Public viewer", body: "Browse sites, read the public records and the flag log. No account, and vendor names are never shown." },
  { icon: "user", name: "Vendor", body: "Apply for sites, follow your queue position, and flag an allocation that broke the stated rules." }
];

export function HomePage() {
  const { isSignedIn, role } = useAuth();
  const [params] = useSearchParams();
  const { sites } = useSites();
  const OPEN = sites.filter((site) => site.status === "available");
  const STEPS = buildSteps(OPEN.length);

  return (
    <>
      <section className="pv-hero" aria-labelledby="hero-h">
        {OPEN[0] && <Link to="/records#spaces" className="pv-float" aria-label={`Open now: ${OPEN[0].name}`}>
          <div className="row"><span>Open now</span><span className="pv-pill good">Available</span></div>
          <h3>{OPEN[0].name}</h3>
          <p>{OPEN[0].sector}, {OPEN[0].district} · {OPEN[0].size.replace(" ", "\u00A0")} · {OPEN[0].type}</p>
          <div className="foot"><Icon name="pin" />{formatRwf(OPEN[0].fee)} / month · {OPEN.length} spaces open</div>
        </Link>}

        <div className="pv-wrap">
          <div className="pv-hero-bottom">
            <div>
              <span className="pv-eyebrow"><i />Public allocation record</span>
              <h1 id="hero-h" className="pv-h1"><span>Vending space,</span><span>allocated in the open.</span></h1>
              <div className="pv-row">
                <Link to="/#map" className="pv-btn pv-btn-lime">Explore available sites <span className="ic"><Icon name="arrow" /></span></Link>
                <Link to="/records" className="pv-btn pv-btn-glass">View public records</Link>
              </div>
            </div>
            <p className="pv-hero-body">
              Find legal vending spaces, follow a transparent queue, and check every allocation. <em>Open spaces. Dated records. No silent edits.</em>
            </p>
          </div>
        </div>
      </section>

      <section className="pv-sec" id="map" aria-labelledby="map-h" style={{ paddingBottom: 96 }}>
        <div className="pv-wrap">
          <div className="pv-head pv-rv">
            <div>
              <span className="pv-eyebrow"><i />Site registry</span>
              <h2 id="map-h" className="pv-h2">Find a site<br />on the map.</h2>
            </div>
            <p className="pv-muted">Every listed vending site with its location, fee and terms. Anyone can browse; sign in as a vendor to apply.</p>
          </div>
          <Suspense fallback={<div className="grid h-[560px] place-items-center rounded-[24px] bg-[var(--mist)] text-[var(--text-2)]">Loading map…</div>}>
            <SitesExplorer query={params.get("site") ?? ""} />
          </Suspense>
        </div>
      </section>

      <section className="pv-sec pv-dark" id="how" aria-labelledby="how-h">
        <div className="pv-wrap">
          <div className="pv-head pv-rv">
            <div>
              <span className="pv-eyebrow"><i />How it works</span>
              <h2 id="how-h" className="pv-h2">From open site to<br />fair decision.</h2>
            </div>
            <p className="pv-muted">Three steps, each one visible to the public.</p>
          </div>
          <div className="pv-cards3">
            {STEPS.map((s, i) => (
              <article key={s.title} className={`pv-card pv-rv${s.rec ? " rec" : ""}`} style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="top"><span className="step">{s.step}</span>{s.rec && <span className="pv-badge">Timestamped</span>}</div>
                <span className="ico"><Icon name={s.icon} className="size-6" /></span>
                <h3 className="pv-h3">{s.title}</h3>
                <p>{s.body}</p>
                <div className="big">{s.big}</div>
                <small>{s.unit}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pv-sec" id="documents" aria-labelledby="docs-h">
        <div className="pv-wrap">
          <div className="pv-head pv-rv">
            <div>
              <span className="pv-eyebrow"><i />Open documents</span>
              <h2 id="docs-h" className="pv-h2">Records anyone<br />can read and reuse.</h2>
            </div>
            <p className="pv-muted">Download the registers as CSV or JSON, or read them on the page. Vendor names and personal details are never published.</p>
          </div>
          <div className="pv-docs">
            {DATASETS.map((d, i) => (
              <article key={d.key} className="pv-doc pv-rv" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="tag"><span className="sheet"><Icon name="record" className="size-5" /></span><span>Dataset</span></div>
                <h3 className="pv-h3">{d.title}</h3>
                <p>{d.description}</p>
                <span className="meta">{datasetMeta(d)}</span>
                <div className="pv-row"><DownloadButtons dataset={d} /></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pv-sec" aria-labelledby="latest-h">
        <div className="pv-wrap">
          <div className="pv-head pv-rv">
            <div>
              <span className="pv-eyebrow"><i />Open now</span>
              <h2 id="latest-h" className="pv-h2">Spaces you can<br />apply for.</h2>
            </div>
            <Link to="/records#spaces" className="pv-btn pv-btn-line">All vending spaces <Icon name="arrow" /></Link>
          </div>
          <div className="pv-feed pv-rv">
            {OPEN.map((site) => (
              <Link key={site.id} to={`/records?q=${encodeURIComponent(site.name)}#spaces`}>
                <span className="ref">{site.reference}</span>
                <span className="what"><b>{site.name}</b><span>{site.sector}, {site.district} · {site.type} · {site.size}</span></span>
                <span className="pv-pill good">Available</span>
                <time>{formatRwf(site.fee)} / mo</time>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pv-sec" style={{ paddingTop: 0 }} aria-labelledby="who-h">
        <div className="pv-wrap">
          <div className="pv-head pv-rv">
            <div>
              <span className="pv-eyebrow"><i />Who sees what</span>
              <h2 id="who-h" className="pv-h2">Open to all.<br />Accountable to each.</h2>
            </div>
            <p className="pv-muted">The public reads everything that matters. Only signed-in users can act.</p>
          </div>
          <div className="pv-roles pv-rv">
            {ROLES_INFO.map((r) => (
              <div key={r.name} className="pv-role"><Icon name={r.icon} /><b>{r.name}</b><span>{r.body}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="pv-dark" aria-labelledby="cta-h">
        <div className="pv-wrap">
          <div className="pv-band">
            <div className="pv-band-copy pv-rv">
              <span className="pv-eyebrow"><i />Take part</span>
              <h2 id="cta-h" className="pv-band-title">Check the record.<br />Ask the question.</h2>
              <p className="pv-muted">If an allocation doesn't match the stated rules, you can see it and say so.</p>
              <div className="pv-row">
                <Link to="/records" className="pv-btn pv-btn-lime">Read the records <span className="ic"><Icon name="arrow" /></span></Link>
                {isSignedIn && role !== ROLES.PUBLIC
                  ? <Link to={HOME_BY_ROLE[role]} className="pv-btn pv-btn-glass">My workspace</Link>
                  : <Link to="/login" className="pv-btn pv-btn-glass">Sign in or register</Link>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
