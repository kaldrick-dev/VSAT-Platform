# Access control (RBAC)

Three actors from the SRS / Appendix B. Public viewers have no account. Public data is about **spaces, not people**. Vendors and admins sign in; the role is in the JWT (`role` claim) and is **enforced by the API**. The web app only hides UI and guards routes for convenience (`web/src/lib/access.js`).

| Actor | Account | Lands on after sign-in | Can see |
|---|---|---|---|
| Public viewer | none | `/` (public records live here only) | Home, site map, public record (decisions, flag log) |
| Vendor | yes (`vendor`) | `/workspace` | Everything public, plus their own applications and queue positions |
| Admin | yes (`admin`) | `/workspace` | Everything public, plus the full application queue and decision entry |

## Web routes

| Route | Public | Vendor | Admin |
|---|---|---|---|
| `/`, `/records` (`/dashboard` redirects here) | yes | yes | yes |
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
| `PATCH /applications/:id` | yes | admin | `{ outcome: approved or rejected, reason }`. Writes an allocation entry and notifies the vendor |
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
| `GET /public/spaces`, `/public/activity`, `/public/flags` | no | any | Spaces and events only. `?format=csv` downloads CSV |

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
