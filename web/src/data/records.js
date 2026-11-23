// Placeholder public records until the API serves them (GET /allocations, /flags).
// Public data describes SPACES, never people: no vendor names, applicant details or
// decision reasons (those are visible to administrators only). See docs/ACCESS.md.

export const statusLog = [
  { id: "EV-1042", date: "2026-11-12", site: "Remera Taxi Park", district: "Gasabo", event: "Allocated", note: "Allocated through the public queue." },
  { id: "EV-1041", date: "2026-11-10", site: "Nyabugogo Transit Hub", district: "Nyarugenge", event: "Listed", note: "Space published and open for applications." },
  { id: "EV-1038", date: "2026-11-08", site: "Nyarugenge Market South", district: "Nyarugenge", event: "Allocated", note: "Allocated through the public queue." },
  { id: "EV-1035", date: "2026-11-03", site: "Kacyiru Community Row", district: "Gasabo", event: "Paused", note: "Listing paused while drainage work is completed." },
  { id: "EV-1031", date: "2026-10-29", site: "Gikondo Commercial Lane", district: "Kicukiro", event: "Listed", note: "Space published and open for applications." },
  { id: "EV-1027", date: "2026-10-24", site: "Kicukiro Centre Arcade", district: "Kicukiro", event: "Paused", note: "Listing paused pending site verification." },
  { id: "EV-1024", date: "2026-10-21", site: "Kimironko Market East", district: "Gasabo", event: "Listed", note: "Space published and open for applications." }
];

// Flags carry a category only. The free-text a vendor writes is not published.
export const flags = [
  { id: "FL-0007", event: "EV-1042", date: "2026-11-14", category: "Queue order", status: "Open", note: "" },
  { id: "FL-0006", event: "EV-1038", date: "2026-11-10", category: "Published terms", status: "Resolved", note: "Reviewed by the administrator. The allocation stands." }
];

export const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

/** Most recent publication date across the public logs. */
export const lastUpdated = [...statusLog, ...flags].reduce((latest, row) => (row.date > latest ? row.date : latest), "");
