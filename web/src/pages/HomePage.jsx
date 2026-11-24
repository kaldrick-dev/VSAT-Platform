import { Suspense, lazy } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Icon, MapSkeleton } from "../components/ui.jsx";
import { formatRwf } from "../data/sites.js";
import { useSites } from "../hooks/useSites.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { HOME_BY_ROLE, ROLES } from "../lib/access.js";

// The map pulls in MapLibre, so load it after the hero has painted.
const SitesExplorer = lazy(() => import("../components/SitesExplorer.jsx"));

const buildSteps = (open, listed) => [
  { icon: "map", step: "Step 01", title: "Browse verified sites", body: "See location, availability, fees and terms before you apply. No account needed.", big: `${open}`, unit: "spaces open now" },
  { icon: "clock", step: "Step 02", title: "Apply and track your place", body: "Every application is timestamped, so queue order stays visible and can be checked.", big: "#1", unit: "your place in line, always visible", rec: true },
  { icon: "record", step: "Step 03", title: "Check every outcome", body: "Sign in to read the dated allocation record. Nothing is edited, and applicant details stay private.", big: `${listed}`, unit: "spaces listed" }
];

const ROLES_INFO = [
  { icon: "search", name: "Public viewer", body: "Browse the map of vending sites. Sign in to read the allocation records and the flag log. Vendor names are never shown." },
  { icon: "user", name: "Vendor", body: "Apply for sites, follow your queue position, and flag an allocation that broke the stated rules." }
];

export function HomePage() {
  const { isSignedIn, role } = useAuth();
  const [params] = useSearchParams();
  const { sites } = useSites();
  const OPEN = sites.filter((site) => site.status === "available");
  const STEPS = buildSteps(OPEN.length, sites.length);

  return (
    <>
      <section className="pv-hero" aria-labelledby="hero-h">
        <div className="pv-wrap">
          <div className="pv-hero-bottom">
            <div>
              <span className="pv-eyebrow"><i />Public allocation record</span>
              <h1 id="hero-h" className="pv-h1"><span>Vending space,</span><span>allocated in the open.</span></h1>
              <div className="pv-row">
                <Link to="/#map" className="pv-btn pv-btn-lime">Explore available sites <span className="ic"><Icon name="arrow" /></span></Link>
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
          <Suspense fallback={<MapSkeleton className="h-[560px] rounded-[24px]" />}>
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

      <section className="pv-sec" aria-labelledby="latest-h">
        <div className="pv-wrap">
          <div className="pv-head pv-rv">
            <div>
              <span className="pv-eyebrow"><i />Open now</span>
              <h2 id="latest-h" className="pv-h2">Spaces you can<br />apply for.</h2>
            </div>
            <Link to="/#map" className="pv-btn pv-btn-line">See them on the map <Icon name="arrow" /></Link>
          </div>
          <div className="pv-feed pv-rv">
            {OPEN.map((site) => (
              <Link key={site.id} to={`/sites/${site.id}/apply`}>
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
            <p className="pv-muted">Anyone can browse the map. Sign in to read the allocation records or to act.</p>
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
              <p className="pv-muted">Sign in to see every allocation. If one doesn't match the stated rules, you can say so.</p>
              <div className="pv-row">
                {isSignedIn && role !== ROLES.PUBLIC
                  ? <Link to={HOME_BY_ROLE[role]} className="pv-btn pv-btn-lime">My workspace <span className="ic"><Icon name="arrow" /></span></Link>
                  : <Link to="/login" className="pv-btn pv-btn-lime">Sign in or register <span className="ic"><Icon name="arrow" /></span></Link>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
