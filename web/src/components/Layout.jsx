import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { useNotifications } from "../hooks/useNotifications.js";
import { ROLE_LABEL, navGroupsFor, pagesFor } from "../lib/access.js";
import { Button, Icon, IconButton } from "./ui.jsx";


export function Logo({ className = "" }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="font-logo text-[20px] tracking-[0.02em] font-bold">VSAT</span>
    </span>
  );
}

function NavItem({ path: to, label, icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex h-10 shrink-0 items-center gap-3 whitespace-nowrap rounded-full px-3.5 text-[13.5px] transition ${
          isActive ? "bg-accent-soft font-medium text-accent" : "text-mute hover:bg-sunken hover:text-ink"
        }`
      }
    >
      <Icon name={icon} className="size-[18px]" />
      {label}
    </NavLink>
  );
}

export function Layout() {
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const { user, role, isSignedIn, signOut } = useAuth();
  const navGroups = navGroupsFor(role);
  const { unread } = useNotifications();

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Search acts on the workspace site map.
  function onSearch(event) {
    event.preventDefault();
    navigate(query.trim() ? `/sites?site=${encodeURIComponent(query.trim())}` : "/sites");
  }

  return (
    <div className="h-dvh overflow-hidden bg-surface">
      <div className="flex h-full w-full overflow-hidden">
        <aside className="hidden w-[244px] shrink-0 flex-col border-r border-line bg-frame px-4 pb-4 pt-5 lg:flex">
          <NavLink to="/workspace" aria-label="Workspace overview" className="rounded-xl px-2 py-1">
            <Logo />
          </NavLink>

          <nav aria-label="Primary" className="mt-7 grid gap-6">
            {navGroups.map((group) => (
              <div key={group.heading} className="grid gap-1">
                <span className="px-3.5 pb-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint">{group.heading}</span>
                {group.items.map((item) => <NavItem key={item.path} {...item} />)}
              </div>
            ))}
          </nav>

          <div className="mt-auto grid gap-4">
            <div className="border-t border-line pt-4">
              <span className="grid size-7 place-items-center rounded-lg bg-accent-soft text-accent"><Icon name="lock" className="size-3.5" /></span>
              <p className="mt-3 text-[13px] font-medium">Append-only record</p>
              <p className="mt-1 text-xs leading-relaxed text-mute">Every allocation decision is timestamped and cannot be edited or deleted.</p>
            </div>
            <div className="flex items-center justify-end pl-1">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint">v0.1</span>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-line bg-surface">
          <header className="flex items-center gap-2.5 px-3 py-3 sm:px-6">
            <NavLink to="/workspace" aria-label="Workspace overview" className="mr-1 lg:hidden"><Logo /></NavLink>

            <form role="search" onSubmit={onSearch} className="relative max-w-[460px] flex-1">
              <span className="sr-only">Search sites</span>
              <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-faint" />
              <input
                ref={searchRef}
                aria-label="Search sites"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search sites, sectors, districts… (Enter)"
                className="h-10 w-full rounded-lg bg-frame pl-11 pr-14 text-[13.5px] ring-[0.5px] ring-ink/25 placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 gap-1 font-mono text-[10.5px] text-faint sm:flex">
                <span className="rounded bg-sunken px-1.5 py-0.5">⌘</span>
                <span className="rounded bg-sunken px-1.5 py-0.5">K</span>
              </kbd>
            </form>

            <div className="ml-auto flex items-center gap-2">
              <IconButton icon="bell" label={unread ? `${unread} unread notifications` : "Notifications"} badge={unread > 0} onClick={() => navigate("/notifications")} />
              {isSignedIn ? (
                <>
                  <span className="hidden text-right leading-tight sm:block">
                    <span className="block max-w-[160px] truncate text-[13px] font-medium">{user.name ?? user.email}</span>
                    <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint">{ROLE_LABEL[role]}</span>
                  </span>
                  <IconButton icon="logout" label="Sign out" onClick={() => { signOut(); navigate("/"); }} />
                </>
              ) : (
                <Button to="/login" size="md" className="max-sm:px-4">
                  <Icon name="user" className="size-4 sm:hidden" />
                  <span className="max-sm:sr-only">Sign in</span>
                </Button>
              )}
            </div>
          </header>

          <nav aria-label="Primary" className="flex gap-1.5 overflow-x-auto px-3 pb-3 sm:px-5 lg:hidden [scrollbar-width:none]">
            {pagesFor(role).map((item) => <NavItem key={item.path} {...item} />)}
          </nav>
          </div>

          <main className="relative min-h-0 flex-1 overflow-y-auto bg-surface">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
