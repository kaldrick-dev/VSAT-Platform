// Single source of truth for who can see what in the web app.
// Mirrors docs/ACCESS.md. The API enforces the same rules server-side; this
// file only decides what the UI shows and which routes it will render.

export const ROLES = { PUBLIC: "public", VENDOR: "vendor", ADMIN: "admin" };

// `roles: null` = open to everyone (including signed-out visitors).
export const PAGES = [
  { path: "/workspace", label: "Overview", icon: "layers", group: "Workspace", roles: [ROLES.VENDOR, ROLES.ADMIN], end: true },
  { path: "/sites", label: "Site map", icon: "map", group: "Workspace", roles: [ROLES.VENDOR, ROLES.ADMIN] },
  { path: "/vendor", label: "My applications", icon: "clock", group: "Workspace", roles: [ROLES.VENDOR] },
  { path: "/flags", label: "My flags", icon: "flag", group: "Workspace", roles: [ROLES.VENDOR] },
  { path: "/admin", label: "Application queue", icon: "shield", group: "Workspace", roles: [ROLES.ADMIN], end: true },
  { path: "/admin/sites", label: "Manage sites", icon: "store", group: "Manage", roles: [ROLES.ADMIN] },
  { path: "/admin/flags", label: "Flag review", icon: "flag", group: "Manage", roles: [ROLES.ADMIN] },
  { path: "/admin/log", label: "Decision log", icon: "record", group: "Manage", roles: [ROLES.ADMIN] },
  { path: "/notifications", label: "Notifications", icon: "bell", group: "Account", roles: [ROLES.VENDOR, ROLES.ADMIN] },
  { path: "/profile", label: "Profile & documents", icon: "user", group: "Account", roles: [ROLES.VENDOR] },
  { path: "/help", label: "Help", icon: "list", group: "Account", roles: [ROLES.VENDOR, ROLES.ADMIN] }
];

// Where each role lands after signing in.
export const HOME_BY_ROLE = {
  [ROLES.PUBLIC]: "/",
  [ROLES.VENDOR]: "/workspace",
  [ROLES.ADMIN]: "/workspace"
};

export const ROLE_LABEL = {
  [ROLES.PUBLIC]: "Public viewer",
  [ROLES.VENDOR]: "Vendor",
  [ROLES.ADMIN]: "Administrator"
};

export const canAccess = (page, role) => !page.roles || page.roles.includes(role);

export const pagesFor = (role) => PAGES.filter((page) => canAccess(page, role));

export function navGroupsFor(role) {
  const groups = [];
  for (const page of pagesFor(role)) {
    let group = groups.find((g) => g.heading === page.group);
    if (!group) groups.push((group = { heading: page.group, items: [] }));
    group.items.push(page);
  }
  return groups;
}

// Only allow same-origin relative paths as post-login redirects.
export const safeNext = (next) => (next && next.startsWith("/") && !next.startsWith("//") ? next : null);
