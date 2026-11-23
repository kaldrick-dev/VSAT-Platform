# SKILLS.md — Backend coding style for VSAT

This is the style I will follow for everything in `api/`. Please approve or amend it before I write any backend code.

## Stack
- Node.js 20+, ES modules (`"type": "module"`), Express 5, Prisma ORM, PostgreSQL 17.
- Validation: zod. Auth: JWT (HS256) + bcryptjs. Tests: `node --test` + supertest.
- Plain JavaScript (no TypeScript), matching the existing `api/` and `web/` code. Prisma gives the types of the data layer.

## Layout
```
api/
  prisma/
    schema.prisma
    migrations/
    seed.js
  src/
    server.js            # boots the HTTP server only
    app.js               # builds the Express app (testable, no listen)
    config/env.js        # the only place that reads process.env (validated with zod)
    lib/prisma.js        # single PrismaClient instance
    middleware/          # auth, requireRole, validate, errors, rateLimit
    modules/
      <feature>/
        <feature>.routes.js      # URL -> controller, middleware per route
        <feature>.controller.js  # parse req, call service, shape res
        <feature>.service.js     # business rules + Prisma calls
        <feature>.schemas.js     # zod schemas
    utils/
  test/
```
Features: `auth`, `users`, `sites`, `applications`, `allocations`, `flags`, `notifications`, `documents`, `public` (open data).

## Layering rules
- **Routes** only wire URL, auth, role and validation middleware to a controller.
- **Controllers** are thin: read validated input, call one service function, send the response. No Prisma, no business rules.
- **Services** own business rules and all Prisma access. They know nothing about `req`/`res`.
- A service never imports another feature's routes. Cross-feature calls go service to service.

## Naming and syntax
- Files `kebab-case` or `feature.role.js`; functions and variables `camelCase`; classes `PascalCase`; constants `UPPER_SNAKE`.
- Prisma models `PascalCase` singular (`Site`), mapped to `snake_case` plural tables with `@@map`; fields `camelCase` mapped with `@map`.
- API JSON uses `camelCase`. REST paths are plural nouns under `/api/v1`.
- `const` by default, arrow functions for handlers, named exports (no default exports except config files).
- Early returns over nested `if`. No `else` after `return`. No unused code or commented-out code.
- Comments are one line only, and only at the top of a class or a whole util library, saying why it exists. No comments inside functions, no JSDoc blocks.
- Code is concise and simple, at the level a college student can read and write: plain functions, no clever tricks, no deep abstractions, no metaprogramming.
- 2-space indent, double quotes, semicolons, trailing commas off (same as the repo today).

## Express conventions
- Express 5 handles rejected promises, so handlers are plain `async` with no try/catch wrappers.
- Every route validates `body`, `query` and `params` with a zod schema via `validate()` middleware. Controllers receive parsed values only.
- Errors: throw `HttpError(status, code, message, details?)` from services. One error middleware converts to `{ code, message, details }`. Unknown errors become 500 with no stack leaked in production.
- Status codes: 200 read/update, 201 create (with the new resource), 204 delete, 400 validation, 401 unauthenticated, 403 wrong role, 404 missing, 409 conflict.
- Lists are paginated (`limit`, `cursor`/`page`) with a hard maximum.

## Security and RBAC
- Roles: `public` (no token), `vendor`, `admin`, as in `docs/ACCESS.md`. `requireRole("admin")` is applied at the route; ownership checks (a vendor sees only their own applications) live in the service.
- Public endpoints return **spaces and events, never people**: no vendor names, emails, applicant details or decision reasons.
- Passwords hashed with bcrypt (cost 12). JWTs short-lived. Secrets only from env. `helmet`, CORS allow-list, rate limiting on auth routes.
- Never interpolate user input into SQL. Use Prisma queries. `$queryRaw` only with tagged templates.
- Never log tokens, passwords or personal data.

## Data and Prisma
- All schema changes go through `prisma migrate` migrations, committed. No manual DB edits.
- The allocation log is **insert-only**: no update or delete code paths, enforced by a database trigger in a migration as well as in the service.
- Multi-step writes use `prisma.$transaction`. Queue order is decided by server timestamp, never client input.
- Select only the fields a response needs (`select`), never return a whole user row.
- Seed script is idempotent and creates demo data for local dev only.

## Testing
- Tests are simple CRUD tests that are easy to understand: create, read, update, delete one thing and check the response.
- Each test has one clear name (`creates a site`, `rejects a vendor creating a site`) and a few lines: request, then assert.
- Per endpoint, cover the happy path plus one 401/403 and one 400 case. No elaborate setup or shared helpers beyond login and cleanup.
- Tests run against a separate test database; no mocking Prisma.
- `npm test` must pass before a branch is opened for review.

## Git workflow
- One GitHub issue per unit of work. Branch name: `feat/<issue#>-short-slug` (or `fix/`, `chore/`, `docs/`).
- Small commits in the imperative mood: `Add site routes with admin guard`. Reference the issue (`Refs #12`).
- Commits are authored as you only. I will **not** add `Co-Authored-By` or any other trailer, so I won't show up as a contributor.
- Each branch is merged via PR into `main` when you say so. I won't merge or push to `main` myself.

## Definition of done (per issue)
1. Schema and migration (if data changes).
2. Routes, controller, service, schemas.
3. Tests passing.
4. `docs/ACCESS.md` updated if exposure changes.
5. Frontend `lib/api.js` call matches the contract.
