// Thin client for the VSAT REST API (see api/src/routes/index.js).
// Base URL comes from VITE_API_BASE_URL (default: /api/v1, proxied to :4000 by Vite).

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

export const api = {
  health: () => request("/health"),

  register: (data) => request("/auth/register", { method: "POST", body: data }),
  login: (data) => request("/auth/login", { method: "POST", body: data }),

  listSites: (filters) => request("/sites", { query: filters }),
  createSite: (data) => request("/sites", { method: "POST", body: data }),

  applyToSite: (siteId, data) => request(`/sites/${siteId}/applications`, { method: "POST", body: data }),
  myApplications: () => request("/applications/me"),

  listAllocations: (filters) => request("/allocations", { query: filters }),
  recordAllocation: (data) => request("/allocations", { method: "POST", body: data }),

  dashboardOutcomes: (filters) => request("/dashboard/outcomes", { query: filters }),

  listFlags: () => request("/flags"),
  flagAllocation: (allocationId, data) => request(`/allocations/${allocationId}/flags`, { method: "POST", body: data })
};
