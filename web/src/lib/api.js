// Thin client for the VSAT REST API (see api/src/routes/index.js).
// Base URL comes from VITE_API_BASE_URL (default: /api/v1, proxied to :4001 by Vite).

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const TOKEN_KEY = "vsat.token";

export const auth = {
  get() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token) {
    try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
  }
};

// Downloads need the token, so they are fetched and saved instead of opened as plain links.
export async function downloadDataset(name, format) {
  const res = await fetch(`${BASE_URL}/public/${name}?format=${format}`, { headers: { Authorization: `Bearer ${auth.get()}` } });
  if (!res.ok) throw new Error("Could not download this file. Please sign in again.");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(await res.blob());
  link.download = `${name}.${format}`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export const ALLOWED_FILE_TYPES = ["application/pdf", "image/png", "image/jpeg"];
export const MAX_FILE_BYTES = 4 * 1024 * 1024;

// A file is sent as the raw request body, so it needs its own fetch instead of the JSON helper.
export async function uploadDocument(file, { kind, name }) {
  const params = new URLSearchParams({ kind, fileName: file.name, ...(name ? { name } : {}) });
  const res = await fetch(`${BASE_URL}/documents?${params}`, {
    method: "POST",
    headers: { "Content-Type": file.type, Authorization: `Bearer ${auth.get()}` },
    body: file
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, payload?.message ?? "The upload failed", payload?.details);
  return payload;
}

// Files need the token too, so they are fetched and saved instead of opened as a plain link.
export async function downloadDocument(document) {
  const res = await fetch(`${BASE_URL}/documents/${document.id}/file`, { headers: { Authorization: `Bearer ${auth.get()}` } });
  if (!res.ok) throw new Error("Could not download this file. Please sign in again.");
  const link = window.document.createElement("a");
  link.href = URL.createObjectURL(await res.blob());
  link.download = document.fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

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
  getSite: (id) => request(`/sites/${id}`),
  createSite: (data) => request("/sites", { method: "POST", body: data }),
  removeSite: (id) => request(`/sites/${id}`, { method: "DELETE" }),
  updateSite: (id, data) => request(`/sites/${id}`, { method: "PATCH", body: data }),

  applyToSite: (siteId, data) => request(`/sites/${siteId}/applications`, { method: "POST", body: data }),
  withdrawApplication: (id) => request(`/applications/${id}/withdraw`, { method: "PATCH" }),
  myApplications: () => request("/applications/me"),
  listApplications: (filters) => request("/applications", { query: filters }),
  decideApplication: (id, data) => request(`/applications/${id}`, { method: "PATCH", body: data }),

  revokeSite: (siteId, data) => request(`/sites/${siteId}/revoke`, { method: "POST", body: data }),
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
  deleteDocument: (id) => request(`/documents/${id}`, { method: "DELETE" }),
  vendorDocuments: (vendorId) => request(`/vendors/${vendorId}/documents`),

  publicData: (name) => request(`/public/${name}`)
};
