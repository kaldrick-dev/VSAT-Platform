import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { HOME_BY_ROLE, ROLES } from "../lib/access.js";
import { Icon } from "./ui.jsx";
import "../public.css";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/#map", label: "Site map", plain: true }
];

export function Logo() {
  return <span className="pv-logo">VSAT</span>;
}

function Nav() {
  const { isSignedIn, role } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  const cta = isSignedIn && role !== ROLES.PUBLIC
    ? { to: HOME_BY_ROLE[role], label: "My workspace" }
    : { to: "/login", label: "Sign in" };

  return (
    <>
      <header className="pv-nav">
        <Link to="/" aria-label="VSAT home"><Logo /></Link>
        <nav className="pv-links" aria-label="Primary">
          {LINKS.map((l) => l.plain
            ? <Link key={l.to} to={l.to}>{l.label}</Link>
            : <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>)}
        </nav>
        <div className="pv-actions">
          <Link to={cta.to} className="pv-btn">{cta.label}</Link>
          <button type="button" className="pv-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            <Icon name={open ? "close" : "menu"} className="size-5" />
          </button>
        </div>
      </header>
      {open && (
        <nav className="pv-sheet" aria-label="Mobile">
          {[...LINKS, { to: cta.to, label: cta.label }].map((l) => <Link key={l.to + l.label} to={l.to}>{l.label}</Link>)}
        </nav>
      )}
    </>
  );
}

function Footer() {
  return (
    <footer className="pv-footer">
      <div className="pv-wrap">
        <div className="pv-foot-grid">
          <div>
            <Logo />
            <p>Vending space, allocated in the open. Every change on the record.</p>
          </div>
          <div className="pv-foot-col">
            <b>Explore</b>
            <Link to="/">Home</Link>
            <Link to="/#map">Site map</Link>
          </div>
          <div className="pv-foot-col">
            <b>Account</b>
            <Link to="/login">Sign in</Link>
            <Link to="/vendor">Vendor workspace</Link>
          </div>
        </div>
        <div className="pv-foot-bottom">
          <span>© 2026 VSAT. No payments are collected on this platform.</span>
          <span>List · Apply · Decide · Verify</span>
        </div>
      </div>
      <div className="pv-foot-glow" aria-hidden="true" />
    </footer>
  );
}

/** Public site shell: floating glass nav, dark footer, fade-up on scroll. */
export function PublicLayout() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const items = document.querySelectorAll(".pv-rv");
    if (!("IntersectionObserver" in window)) return items.forEach((el) => el.classList.add("is-in"));
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
    }, { threshold: 0.12 });
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="pv">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <Nav />
      <main id="main"><Outlet /></main>
      <Footer />
    </div>
  );
}
