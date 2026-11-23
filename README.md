# Vending Space Allocation & Transparency Platform

An initial monorepo scaffold for the SRS-defined platform: a public, auditable record of vending-site applications and allocation outcomes.

## Technology

- `web`: React + Vite, React Router, Tailwind CSS v4, MapLibre GL JS
- `api`: Node.js + Express REST API, Prisma, JWT authentication
- `database`: PostgreSQL, including an insert-only allocation decision log

## Get started

Requirements: Node.js 20+, npm 10+, Docker (optional, for local PostgreSQL).

```bash
npm install
cp api/.env.example api/.env
cp web/.env.example web/.env
docker compose up -d postgres
npm run db:migrate -w @vsat/api
npm run db:seed -w @vsat/api
npm run dev
```

The map uses MapLibre GL JS with the keyless OpenFreeMap Bright style (3D buildings), so no map API key is needed. To use a different basemap, change `MAP_STYLE` in `web/src/components/SitesMap.jsx`.

The frontend runs at `http://localhost:5173`; the API runs at `http://localhost:4000`. The frontend proxies `/api` to the API during development.

## Commands

```bash
npm run dev       # API and frontend
npm run dev:api   # API only
npm run dev:web   # frontend only
npm run build     # production frontend build
npm test          # workspace tests
npm run test:setup -w @vsat/api   # once: migrate the vsat_test database
```

## Project layout

```text
api/
  src/
    modules/             one folder per feature (routes, controller, service, schemas)
    middleware/          errors, validation, authentication
  prisma/                schema, migrations and seed
web/
  src/
    components/          shared UI and map
    pages/               public, vendor, and admin entry points
```

Postgres runs on port 5433 (see `docker-compose.yml`). Seed logins: `admin@example.com` and `vendor@example.com`, password `password123`. API endpoints and who can call them are listed in `docs/ACCESS.md`.

## Deploy on Vercel (web and API together)

One Vercel project serves the web app as static files and the Express API as a serverless function at `/api/v1`. Both share one origin, so no CORS setup is needed. `vercel.json` defines this.

1. Import the repository in Vercel. Keep the root directory as the repo root and the framework preset as "Other". The build settings come from `vercel.json`.
2. Add environment variables: `DATABASE_URL` (a hosted Postgres such as Neon; prefer the pooled connection string) and `JWT_SECRET` (at least 32 random characters, required in production). Optional: `JWT_EXPIRES_IN`.
3. Create the tables once, from your machine, with the production `DATABASE_URL` in `api/.env`: `npm run db:migrate:deploy -w @vsat/api`. Optionally seed demo data with `npm run db:seed -w @vsat/api`, but change the demo passwords first.
4. Deploy. The web app calls `/api/v1/...` on the same domain.

`prisma generate` runs on install, and the schema includes the Linux binary target Vercel needs.

