import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  ["/sites", "Find a site"],
  ["/dashboard", "Public outcomes"],
  ["/vendor", "My applications"],
  ["/admin", "Admin"]
];

export function Layout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink className="brand" to="/" aria-label="VSAT home">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>VSAT Platform</span>
        </NavLink>
        <nav aria-label="Primary navigation">
          {navItems.map(([to, label]) => (
            <NavLink key={to} to={to}>{label}</NavLink>
          ))}
        </nav>
        <NavLink className="button button-small" to="/login">Sign in</NavLink>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <p>Making vending-space decisions visible and auditable.</p>
        <NavLink to="/dashboard">View the public record</NavLink>
      </footer>
    </div>
  );
}

