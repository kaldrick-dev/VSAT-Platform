# Vending Space Allocation & Transparency Platform

An initial monorepo scaffold for the SRS-defined platform: a public, auditable record of vending-site applications and allocation outcomes.

## Technology

- `web`: React + Vite, React Router, Tailwind CSS v4, MapLibre GL JS
- `api`: Node.js + Express REST API, JWT-ready authentication middleware
- `database`: PostgreSQL, including an insert-only allocation decision log

## Get started

Requirements: Node.js 20+, npm 10+, Docker (optional, for local PostgreSQL).

```bash
npm install
cp api/.env.example api/.env
cp web/.env.example web/.env
docker compose up -d postgres
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
```

## Project layout

```text
api/
  src/
    db/migrations/       PostgreSQL schema and audit constraints
    middleware/          API errors and authentication
    routes/              REST resources from the SRS
web/
  src/
    components/          shared UI and map
    pages/               public, vendor, and admin entry points
```

This scaffold establishes the architecture and domain boundaries. Feature handlers intentionally return empty collections until their application services and persistence queries are implemented in the next increments.
