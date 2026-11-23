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
| `POST /auth/register` | no | any | Always creates a `vendor`. Admins are provisioned out of band; never accept `role` from the body |
| `POST /auth/login` | no | any | Returns `{ token, user: { id, name, email, role } }` |
| `GET /auth/me` | yes | any | |
| `GET /sites` | no | any | FR 1.2. Supports `status`, `district` filters |
| `POST /sites` | yes | admin | FR 1.1, 1.3 |
| `POST /sites/:id/applications` | yes | vendor | FR 2.1. One pending application per vendor per site |
| `GET /applications/me` | yes | vendor | Own applications only, each with `queuePosition` (FR 2.2) |
| `GET /applications` | yes | admin | Full queue, oldest first, with vendor identity |
| `POST /allocations` | yes | admin | FR 3.1. Insert-only (FR 3.2) |
| `GET /allocations` | no | any | Public activity log: space, event, date only. Never reason, application or vendor (see below) |
| `GET /dashboard/outcomes` | no | any | Anonymized outcomes by site/district. Filters: district, status, date range (FR 4.2) |
| `GET /exports/:dataset.csv` (planned) | no | any | Backs the downloads on `/records`: `decisions`, `sites`, `flags`. Same anonymization as the JSON endpoints |
| `GET /flags` | no | any | FR 5.2. Public flag log |
| `POST /allocations/:id/flags` | yes | vendor | FR 5.1 |

## Endpoints the workspace pages need (not built yet)

| Endpoint | Roles | Used by |
|---|---|---|
| `GET/PUT /me`, `GET/POST /me/documents` | vendor | Profile & documents |
| `GET /flags/me` | vendor | My flags |
| `GET /flags/review`, `PATCH /flags/:id` (status + public outcome note) | admin | Flag review |
| `GET /allocations/log` (reasons, applications, deciding admin) | admin | Decision log |
| `PATCH /sites/:id` (pause / reopen) | admin | Manage sites |
| `GET /notifications`, `PATCH /notifications/:id/read` | vendor, admin | Notifications, header bell |

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

## Open decisions

- Who resolves flags (`PATCH /flags/:id`)? Appendix B leaves this to design; it should be admin-only and write a resolution note.
- Appendix B names `POST /applications`, `/decisions`, `/flags`; the scaffold uses nested paths. The scaffold paths are kept in `web/src/lib/api.js`.
