// Placeholder workspace data until the API serves it (GET /applications/me, GET /applications).

export const vendorApplication = {
  site: "Kimironko Market East",
  sector: "Kimironko, Gasabo",
  status: "Pending review",
  applied: "14 Nov 2026 · 09:42",
  position: 5,
  total: 9,
  reference: "APP-1098",
  fee: "RWF 18,000",
  updated: "16 Nov 2026"
};

// Pending applications in strict timestamp order (oldest first).
export const adminQueue = [
  { ref: "APP-1071", site: "Nyabugogo Transit Hub", trade: "General merchandise", submitted: "10 Nov · 08:15", docs: "Complete" },
  { ref: "APP-1078", site: "Kimironko Market East", trade: "Produce & groceries", submitted: "11 Nov · 14:02", docs: "Complete" },
  { ref: "APP-1083", site: "Gikondo Commercial Lane", trade: "Produce & crafts", submitted: "12 Nov · 10:47", docs: "Missing ID" },
  { ref: "APP-1090", site: "Nyabugogo Transit Hub", trade: "Electronics repair", submitted: "13 Nov · 16:30", docs: "Complete" },
  { ref: "APP-1098", site: "Kimironko Market East", trade: "Fruit & vegetables", submitted: "14 Nov · 09:42", docs: "Complete" }
];

// ── Notifications (GET /notifications) ───────────────────────────────
export const notificationsSeed = {
  vendor: [
    { id: "n1", title: "Your queue position changed", body: "An earlier application was decided. You are now #5 of 9 for Kimironko Market East.", time: "16 Nov · 11:20", tone: "info", read: false },
    { id: "n2", title: "A document is still missing", body: "Add your trading licence under Profile & documents so your application can be reviewed.", time: "15 Nov · 09:05", tone: "warn", read: false },
    { id: "n3", title: "Application received", body: "Application APP-1098 was timestamped and added to the queue.", time: "14 Nov · 09:42", tone: "good", read: true }
  ],
  admin: [
    { id: "n1", title: "New flag awaiting review", body: "FL-0007 was raised against EV-1042 (Queue order).", time: "14 Nov · 16:10", tone: "warn", read: false },
    { id: "n2", title: "Application with missing documents", body: "APP-1083 for Gikondo Commercial Lane has no ID document attached.", time: "12 Nov · 10:48", tone: "bad", read: false },
    { id: "n3", title: "5 applications are pending", body: "The oldest, APP-1071, has been waiting since 10 Nov.", time: "11 Nov · 08:00", tone: "info", read: true }
  ]
};

// ── Vendor profile and documents (GET/PUT /me, /me/documents) ────────
export const TRADES = ["Produce & groceries", "General merchandise", "Food & beverages", "Tailoring & crafts", "Mixed vending"];

export const vendorProfileSeed = { phone: "", trade: "Produce & groceries", district: "Gasabo", about: "" };

export const documentsSeed = [
  { id: "d1", name: "National ID", hint: "Photo page, clearly readable", status: "Verified", file: "national-id.pdf" },
  { id: "d2", name: "Trading licence", hint: "Current licence or association letter", status: "Missing", file: "" },
  { id: "d3", name: "Proof of residence", hint: "Optional, speeds up review", status: "Pending", file: "residence-letter.jpg" }
];

// ── Vendor's own flags (GET /flags/me) ───────────────────────────────
export const myFlagsSeed = [
  { id: "FL-0006", event: "EV-1038", date: "2026-11-10", category: "Published terms", details: "The terms listed for this space did not mention the tailoring-only rule.", status: "Resolved", note: "Reviewed by the administrator. The allocation stands." }
];

export const FLAG_CATEGORIES = ["Queue order", "Published terms", "Documents", "Other"];

// ── Administrator-only: flag review and decision log ─────────────────
// These contain applicant and vendor information and are NEVER shown publicly.
export const adminFlagsSeed = [
  { id: "FL-0007", event: "EV-1042", site: "Remera Taxi Park", date: "2026-11-14", category: "Queue order", details: "Two applications submitted before mine were not decided first.", by: "Vendor V-2041", status: "Open", note: "" },
  { id: "FL-0006", event: "EV-1038", site: "Nyarugenge Market South", date: "2026-11-10", category: "Published terms", details: "The terms listed for this space did not mention the tailoring-only rule.", by: "Vendor V-1187", status: "Resolved", note: "Reviewed by the administrator. The allocation stands." }
];

export const decisionLog = [
  { id: "AL-1042", date: "2026-11-12", site: "Remera Taxi Park", outcome: "Approved", application: "APP-1049", reason: "First eligible applicant in timestamp order.", by: "Admin" },
  { id: "AL-1038", date: "2026-11-08", site: "Nyarugenge Market South", outcome: "Approved", application: "APP-1044", reason: "Applicant met the published tailoring-zone terms.", by: "Admin" },
  { id: "AL-1031", date: "2026-10-29", site: "Gikondo Commercial Lane", outcome: "Rejected", application: "APP-1036", reason: "Required vendor documents were incomplete.", by: "Admin" },
  { id: "AL-1024", date: "2026-10-21", site: "Kimironko Market East", outcome: "Rejected", application: "APP-1029", reason: "Application was withdrawn before review.", by: "Admin" }
];
