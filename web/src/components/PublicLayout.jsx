import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { HOME_BY_ROLE, ROLES } from "../lib/access.js";
import "../public.css";

export function Logo() {
  return <span className="pv-logo">VSAT</span>;
}

function Nav() {
  const { isSignedIn, role } = useAuth();
  const cta = isSignedIn && role !== ROLES.PUBLIC
    ? { to: HOME_BY_ROLE[role], label: "My workspace" }
    : { to: "/login", label: "Sign in" };

  return (
    <header className="pv-nav">
      <div className="pv-wrap pv-nav-in">
        <Link to="/" aria-label="VSAT home"><Logo /></Link>
        <Link to={cta.to} className="pv-btn">{cta.label}</Link>
      </div>
    </header>
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
    if (!("IntersectionObserver" in window)) return document.querySelectorAll(".pv-rv").forEach((el) => el.classList.add("is-in"));
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
    }, { threshold: 0.12 });
    // Sections that appear after their data loads (like the accountability summary) must be watched too.
    const watch = () => document.querySelectorAll(".pv-rv:not(.is-in)").forEach((el) => io.observe(el));
    watch();
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
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
