// Thin client for the VSAT REST API (see api/src/routes/index.js).
// Base URL comes from VITE_API_BASE_URL (default: /api/v1, proxied to :4000 by Vite).

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const TOKEN_KEY = "vsat.token";

export const publicUrl = (name, format) => `${BASE_URL}/public/${name}?format=${format}`;

export const auth = {
  get() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token) {
    try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
  }
};

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = "GET", body, query } = {}) {
  const params = query
    ? new URLSearchParams(Object.entries(query).filter(([, v]) => v != null && v !== "" && v !== "all"))
    : null;
  const url = `${BASE_URL}${path}${params?.size ? `?${params}` : ""}`;
  const token = auth.get();

  const res = await fetch(url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) {
      auth.set(null);
      window.dispatchEvent(new Event("vsat:unauthorized"));
    }
    throw new ApiError(res.status, payload?.message ?? res.statusText, payload?.details);
  }
  return payload;
}

// The web app shows `user.name`; the API sends `fullName`.
const withName = (session) => ({ ...session, user: { ...session.user, name: session.user.fullName } });

export const api = {
  health: () => request("/health"),

  register: async (data) => withName(await request("/auth/register", { method: "POST", body: data })),
  login: async (data) => withName(await request("/auth/login", { method: "POST", body: data })),
  me: () => request("/auth/me"),

  listSites: (filters) => request("/sites", { query: filters }),
  createSite: (data) => request("/sites", { method: "POST", body: data }),
  updateSite: (id, data) => request(`/sites/${id}`, { method: "PATCH", body: data }),

  applyToSite: (siteId, data) => request(`/sites/${siteId}/applications`, { method: "POST", body: data }),
  myApplications: () => request("/applications/me"),
  listApplications: (filters) => request("/applications", { query: filters }),
  decideApplication: (id, data) => request(`/applications/${id}`, { method: "PATCH", body: data }),

  listAllocations: (filters) => request("/allocations", { query: filters }),

  myFlags: () => request("/flags/me"),
  listFlags: (filters) => request("/flags", { query: filters }),
  flagAllocation: (allocationId, data) => request(`/allocations/${allocationId}/flags`, { method: "POST", body: data }),
  reviewFlag: (id, data) => request(`/flags/${id}`, { method: "PATCH", body: data }),

  notifications: () => request("/notifications"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "POST" }),

  profile: () => request("/profile"),
  updateProfile: (data) => request("/profile", { method: "PATCH", body: data }),
  myDocuments: () => request("/documents"),
  addDocument: (data) => request("/documents", { method: "POST", body: data }),
  deleteDocument: (id) => request(`/documents/${id}`, { method: "DELETE" }),
  vendorDocuments: (vendorId) => request(`/vendors/${vendorId}/documents`),

  publicData: (name) => request(`/public/${name}`)
};
