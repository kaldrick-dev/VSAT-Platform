# VSAT: Vending Space Allocation & Transparency Platform

A public, auditable record of vending-site applications and allocation outcomes.

- **Visitors** browse open spaces on a map without an account. The allocation records, flag log and CSV/JSON downloads are inside the signed-in workspace, and no personal data is ever shown in them.
- **Vendors** register, apply for spaces, follow their queue position, flag allocations and manage their profile and documents.
- **Administrators** publish sites, review the queue in timestamp order, record decisions with a stated reason and review flags.

The allocation log is insert-only: a database trigger rejects any update or delete.

## Technology

| Part | Stack |
|---|---|
| `web` | React 19, Vite, React Router, Tailwind CSS v4, MapLibre GL JS |
| `api` | Node.js, Express 5, Prisma, JWT, zod |
| Database | PostgreSQL 17 |

## Requirements

- Node.js 20 or newer and npm 10 or newer
- Docker (for the local PostgreSQL). Without Docker, use any PostgreSQL 14+ and change `DATABASE_URL` below.

## Run it locally

Run all commands from the repository root.

**1. Install dependencies**

```bash
npm install
```

**2. Create the environment files**

```bash
cp api/.env.example api/.env
cp web/.env.example web/.env
```

The defaults work with the Docker database in step 3. Before using a real deployment, set a long random `JWT_SECRET` in `api/.env`.

**3. Start PostgreSQL**

```bash
docker compose up -d postgres
```

It listens on port **5433** (not 5432, so it does not clash with a Postgres already installed on your machine). Check it is ready with `docker compose ps`; the status should say `healthy`.

**4. Create the tables and demo data**

```bash
npm run db:migrate -w @vsat/api
npm run db:seed -w @vsat/api
```

The seed script creates two demo accounts and seven sites. It is safe to run again.

**5. Start the app**

```bash
npm run dev
```

| What | Address |
|---|---|
| Web app | http://localhost:5173 |
| API | http://localhost:4001/api/v1 |
| API health check | http://localhost:4001/api/v1/health |

The web app forwards `/api` requests to the API, so you only open the web address.

**6. Sign in**

Open http://localhost:5173/login. On the login page, in development, the **Demo vendor** and **Demo admin** buttons fill in the form for you.

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@example.com` | `password123` |
| Vendor | `vendor@example.com` | `password123` |

Anyone can also register a new account on the login page; new accounts are always vendors. Change or remove the demo accounts before you share a real deployment.

## Run the tests

The API tests use their own database, so your local data is never touched. Do this once:

```bash
docker compose exec postgres createdb -U vsat vsat_test
npm run test:setup -w @vsat/api
```

Then, any time:

```bash
npm test
```

This runs the API tests (they need the Docker database from step 3 running) and the web tests.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts the API and the web app together |
| `npm run dev:api` / `npm run dev:web` | Starts only one of them |
| `npm run build` | Builds the web app into `web/dist` |
| `npm test` | Runs all tests |
| `npm run db:migrate -w @vsat/api` | Applies schema changes to your local database |
| `npm run db:seed -w @vsat/api` | Adds the demo accounts and sites |
| `npm run db:migrate:deploy -w @vsat/api` | Applies existing migrations to a hosted database (uses `DIRECT_URL` when set) |

## Configuration

`api/.env`

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://vsat:vsat@localhost:5433/vsat` | PostgreSQL connection string the running app uses. On a hosted database use the **pooled** address |
| `DIRECT_URL` | not set | Hosted databases only: the **direct** address (no `-pooler` in the host), used only for migrations. Falls back to `DATABASE_URL` |
| `JWT_SECRET` | development value | At least 32 characters. **Required in production** |
| `JWT_EXPIRES_IN` | `1h` | How long a sign-in lasts |
| `PORT` | `4001` | API port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed web origins, comma separated |

`web/.env`

| Variable | Default | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Leave as is unless the API is on another domain |
| `VITE_MAPTILER_API_KEY` | not set | Optional MapTiler key for the basemap. Without it the map uses OpenFreeMap |

The map works without a key (it uses the free OpenFreeMap style). If that host is blocked on your network, set `VITE_MAPTILER_API_KEY` in `web/.env` (locally) or in the Vercel project settings (deployed) to use a MapTiler basemap instead. In the MapTiler dashboard, restrict the key to `localhost` and your Vercel domain, because it is visible in the browser. If the keyed style cannot load, the map falls back to OpenFreeMap by itself.

## Troubleshooting

- **`Can't reach database server` or sign-in fails:** check `docker compose ps` shows the database as healthy, and that `DATABASE_URL` in `api/.env` uses port `5433`.
- **`Environment variable not found: DATABASE_URL`:** you have not created `api/.env`. Run step 2.
- **Port already in use:** stop whatever uses 4001 or 5173, or change `PORT` in `api/.env`.
- **Tests fail with a missing table or column:** run `npm run test:setup -w @vsat/api` again after pulling new migrations (and the `createdb` command if you never ran it).
- **`P1002 ... advisory lock` when migrating a hosted database:** you ran the migration over the pooled address. Set `DIRECT_URL` (same host without `-pooler`) in `api/.env` and run it again. If it still times out, an interrupted earlier migration is probably still holding Prisma's lock (it shows as an idle session). End that session in the database's SQL editor (look for an idle session holding advisory lock `72707369` in `pg_locks`, then `select pg_terminate_backend(<pid>);`) or restart the database's compute, and run the migration again.
- **Sign-in worked, then everything shows "Authentication required":** the token lasts one hour. Sign in again.

## Project layout

```text
api/
  index.js               Vercel entry point
  prisma/                schema, migrations and seed script
  src/
    modules/             one folder per feature: routes, controller, service, schemas
    middleware/          errors, validation, authentication, rate limits
    config/              environment variables
  test/                  API tests
web/
  src/
    pages/               public, vendor and admin pages
    components/          shared UI, map, layouts
    hooks/               data loading and sign-in state
    lib/                 API client and access rules
docs/ACCESS.md          who can see and do what, and every API endpoint
SKILLS.md               coding style used in the API
vercel.json             Vercel deployment settings
```

Who can see what is described in [docs/ACCESS.md](docs/ACCESS.md). The coding style for the API is in [SKILLS.md](SKILLS.md).

## Deploy on Vercel (web and API together)

One Vercel project serves the web app as static files and the Express API as a serverless function at `/api/v1`. Both share one origin, so no CORS setup is needed. `vercel.json` defines this.

1. Create a hosted PostgreSQL database (for example on Neon). Neon gives two addresses: a **pooled** one (the host contains `-pooler`) and a **direct** one (the same host without `-pooler`). Keep both.
2. Import the repository in Vercel. Keep the root directory as the repository root and the framework preset as "Other". The build settings come from `vercel.json`.
3. Add environment variables in Vercel: `DATABASE_URL` set to the **pooled** address, and `JWT_SECRET` (at least 32 random characters). Optional: `JWT_EXPIRES_IN`. Do not add `DIRECT_URL` to Vercel; it is only for migrations.
4. Create the tables from your machine, and again after any new migration. In `api/.env` put the pooled address as `DATABASE_URL` and the direct address as `DIRECT_URL`, then run `npm run db:migrate:deploy -w @vsat/api`. Optionally run `npm run db:seed -w @vsat/api`, then change the demo passwords.
5. Deploy. The web app calls `/api/v1/...` on the same domain.

`prisma generate` runs on install, and the schema includes the Linux binary target Vercel needs.
