# Access control (RBAC)

Three actors from the SRS / Appendix B. Public viewers have no account. Public data is about **spaces, not people**. Vendors and admins sign in; the role is in the JWT (`role` claim) and is **enforced by the API**. The web app only hides UI and guards routes for convenience (`web/src/lib/access.js`).

| Actor | Account | Lands on after sign-in | Can see |
|---|---|---|---|
| Public viewer | none | `/` | Home and the site map only. The allocation record needs a sign-in (web); the open-data API endpoints stay public |
| Vendor | yes (`vendor`) | `/workspace` | Everything public, plus their own applications and queue positions |
| Admin | yes (`admin`) | `/workspace` | Everything public, plus the full application queue and decision entry |

## Web routes

| Route | Public | Vendor | Admin |
|---|---|---|---|
| `/` | yes | yes | yes |
| `/records` (`/dashboard` redirects here) | sign in | yes | yes |
| `/sites/:id/record` (one space's allocation record) | sign in | yes | yes |
| `/#map` (home page section) | yes | yes | yes |
| `/workspace` (overview), `/sites` (map), `/notifications`, `/help` | redirect to `/login` | yes | yes |
| `/vendor` (my applications), `/flags` (my flags), `/profile` (profile & documents) | redirect to `/login` | yes | redirect to `/workspace` |
| `/admin` (queue), `/admin/sites`, `/admin/flags`, `/admin/log` | redirect to `/login` | redirect to `/workspace` | yes |
| `/login` | yes | redirect to home | redirect to home |

## API endpoints (`/api/v1`)

| Endpoint | Auth | Roles | Notes |
|---|---|---|---|
| `GET /health` | no | any | |
| `POST /auth/register` | no | any | Always creates a `vendor`; `role` in the body is ignored |
| `POST /auth/login` | no | any | Returns `{ token, user }` |
| `GET /auth/me` | yes | any | |
| `GET /sites`, `GET /sites/:id` | no | any | Filters: `district`, `type`, `status` |
| `POST /sites`, `PATCH /sites/:id` | yes | admin | |
| `POST /sites/:siteId/applications` | yes | vendor | One application per vendor per site; site must be `available` |
| `GET /applications/me` | yes | vendor | Own applications with `queuePosition` |
| `GET /applications` | yes | admin | Queue, oldest first, with vendor identity. Filters: `siteId`, `status` |
| `PATCH /applications/:id` | yes | admin | `{ outcome: approved or rejected, reason, reasonCategory?, outOfOrder? }`. Writes an allocation entry and notifies the vendor. Approving an application that is not first in its site queue returns 409 unless `outOfOrder: true` with a reason of 20+ characters; the entry records queue position, queue size and the override |
| `GET /allocations` | yes | admin, vendor | Admin: full log. Vendor: own entries only. Insert-only |
| `POST /allocations/:allocationId/flags` | yes | vendor | `{ category, note }` |
| `GET /flags/me` | yes | vendor | |
| `GET /flags` | yes | admin | Filter: `status` |
| `PATCH /flags/:id` | yes | admin | `{ status: upheld or dismissed, reviewNote }`. Notifies the vendor |
| `GET /notifications` | yes | any | Own, with `unread` count |
| `PATCH /notifications/:id/read`, `POST /notifications/read-all` | yes | any | |
| `GET/PATCH /profile` | yes | vendor | |
| `GET/POST /documents`, `DELETE /documents/:id` | yes | vendor | Own documents |
| `GET /vendors/:id/documents` | yes | admin | |
| `GET /public/summary` | no | any | Counts only: allocations (total, out of queue order, by district) and flags (raised, answered, on time, overdue, upheld, average days to answer). Accepts `from` and `to` |
| `GET /public/spaces`, `/public/activity`, `/public/flags` | no | any | Spaces and events only. `?format=csv` downloads CSV. `activity` and `flags` accept `from` and `to` (YYYY-MM-DD). `activity` shows queue position, queue size, an out-of-order marker and a reason category, never names or free-text reasons |

## Field exposure (NFR 7)

| Data | Public | Vendor | Admin |
|---|---|---|---|
| Site fields (name, district, coordinates, size, fee, terms, status) | yes | yes | yes |
| Queue length per site | count only | count only | full list |
| Own application and queue position | n/a | yes | n/a |
| Other vendors' applications | no | no | yes |
| Allocation event: space, event type (listed / allocated / paused), date | yes | yes | yes |
| Allocation: stated reason, winning application, vendor identity | **no** | own application only | yes |
| Allocation: deciding admin | **no** | no | yes |
| Flag: category, status, dates, resolution note | yes | yes | yes |
| Flag: free-text reason written by the vendor | **no** | own only | yes |
| Flag: `submitted_by` | **no** | own only | yes |
| User email, password hash | no | own email only | never the hash |
