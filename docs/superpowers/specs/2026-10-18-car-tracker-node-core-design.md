# car-tracker-node — Stage 1: Core Slice

**Date:** 2026-10-18
**Status:** Approved 2026-10-18 (revised after a toolchain probe; see "Revisions" at the end)

## Purpose

Port the Laravel `car-tracker` API to Node.js + Express as the developer's first Node
project. The primary goal is **learning Node well** coming from PHP/Laravel; the secondary
goal is a working, tested API that can grow to feature parity over later stages.

Success for this stage:

- The core slice below works end to end and is covered by feature tests that pass.
- The code is organised so that later stages (fuel, trips, documents, OTP, notifications,
  …) are additive: a new folder under `src/modules/`, not a restructure.
- The repo is pushed to `https://github.com/Naderadelp/car-tracker-node`.

## Scope

**In:** project skeleton, auth (register / login / me with JWT), cars CRUD, car logs CRUD
with odometer advancement, reminders CRUD, and the due-reminders query (by date or by km).

**Out (later stages, each with its own spec):** brand → car-model catalog, email OTP,
password reset, logout/token revocation, roles & permissions, documents & file uploads,
fuel / trips / parking / costs / services, Firebase push notifications, scheduled jobs,
events/listeners, admin panel, soft deletes, activity log, warranty fields.

## Tech Stack

| Concern | Choice | Laravel equivalent |
|---|---|---|
| Runtime | Node 24 | PHP 8.3 |
| Language | TypeScript, ES modules (`import`/`export`) | — |
| HTTP | Express 5 | Routing + controllers |
| Dev runner | `tsx watch` | `php artisan serve` |
| Database | PostgreSQL 16 via Docker Compose (host port 5434) | SQLite / MySQL |
| ORM + migrations | Prisma 7 (`prisma-client` generator + `@prisma/adapter-pg`) | Eloquent + migrations |
| Validation | Zod | FormRequest `rules()` |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` | Sanctum |
| Tests | Vitest + Supertest | PHPUnit feature tests |

## Project Location and Git

- Directory: `~/Desktop/studing/car-tracker-node` (sibling of the Laravel repo, which is not
  modified).
- First implementation step runs exactly the developer's commands:

  ```bash
  mkdir car-tracker-node && cd car-tracker-node
  echo "# car-tracker-node" >> README.md
  git init
  git add README.md
  git commit -m "first commit"
  git branch -M main
  git remote add origin https://github.com/Naderadelp/car-tracker-node.git
  git push -u origin main
  ```

- This spec is then copied into the new repo at
  `docs/superpowers/specs/2026-10-18-car-tracker-node-core-design.md` and committed there.
- Each later implementation step is its own commit.

## Project Structure

Feature folders, layered (controller → service → Prisma). No repository layer: the Prisma
client already plays that role.

```
car-tracker-node/
├── docker-compose.yml          # Postgres 16 on 127.0.0.1:5434; creates car_tracker and car_tracker_test
├── .env.example                # copied to .env
├── .env.test.example           # copied to .env.test
├── prisma.config.ts            # Prisma 7 CLI config (loads .env or .env.test)
├── prisma/schema.prisma
├── src/
│   ├── app.ts                  # builds and exports the Express app (no listen)
│   ├── server.ts               # imports app, calls listen(PORT)
│   ├── config/env.ts           # parses process.env with Zod; app fails fast if invalid
│   ├── lib/prisma.ts           # single shared PrismaClient
│   ├── lib/errors.ts           # AppError + subclasses
│   ├── lib/pagination.ts       # page/perPage parsing and meta builder
│   ├── lib/schemas.ts          # shared Zod pieces (isoDate, id)
│   ├── types/express.d.ts      # adds req.user / req.validated to Express's Request type
│   ├── generated/prisma/       # Prisma client output (gitignored, rebuilt by `prisma generate`)
│   ├── middleware/
│   │   ├── authenticate.ts
│   │   ├── validate.ts
│   │   └── error-handler.ts
│   └── modules/
│       ├── auth/
│       ├── cars/
│       ├── car-logs/
│       └── reminders/
│           ├── reminders.routes.ts
│           ├── reminders.controller.ts
│           ├── reminders.service.ts
│           ├── reminders.schemas.ts
│           └── reminders.test.ts
└── tests/
    ├── setup.ts                # truncates all tables before each test
    └── helpers.ts              # createUser / createCar
```

Responsibilities:

- **routes**: maps paths to `authenticate`, `validate(schema)` and controller functions.
- **controller**: reads `req`, calls one service function, sends the response. Never
  imports Prisma.
- **service**: plain async functions taking plain arguments (e.g.
  `createCar(userId, data)`). All business rules and Prisma access live here. No `req` or
  `res`.
- **schemas**: Zod schemas for body, params and query; their inferred types are the
  service input types.

## Data Model

All ids are auto-increment integers. All tables have `createdAt` / `updatedAt` unless
noted. Deleting a user cascades to cars; deleting a car cascades to its logs and reminders.

**User**
- `id`, `name` (string), `email` (string, unique), `passwordHash` (string)

**Car**
- `id`, `userId` → User
- `make` (string), `model` (string), `color` (string, optional)
- `currentKm` (int, default 0, ≥ 0)
- `tankSize` (Decimal(6,2), optional)
- `purchasedAt` (date, optional)

**CarLog**
- `id`, `carId` → Car
- `title` (string), `category` (string, optional)
- `odometerAtService` (int, ≥ 0)
- `actualCost` (Decimal(10,2), optional)
- `performedAt` (date)
- `notes` (text, optional)

**Reminder**
- `id`, `carId` → Car
- `title` (string), `description` (text, optional)
- `remindOn` (date, optional), `remindAtKm` (int, optional)
- `notifiedAt` (timestamp, optional)
- Validation rule: at least one of `remindOn` / `remindAtKm` must be present on create.

Decimal fields are serialised in JSON as strings (e.g. `"45.5"`, `"850.25"`) to avoid
floating-point loss. Date-only fields are sent in as `"YYYY-MM-DD"` and come back as ISO
timestamps at UTC midnight (e.g. `"2026-10-01T00:00:00.000Z"`).

## API

Base path `/api`. All routes except register and login require
`Authorization: Bearer <token>`.

| Method | Path | Success |
|---|---|---|
| GET | `/health` | 200 `{ status: "ok" }` (no auth) |
| POST | `/auth/register` | 201 `{ data: { user, token } }` |
| POST | `/auth/login` | 200 `{ data: { user, token } }` |
| GET | `/auth/me` | 200 `{ data: user }` |
| GET | `/cars` | 200 paginated list of the caller's cars |
| POST | `/cars` | 201 |
| GET / PATCH / DELETE | `/cars/:carId` | 200 / 200 / 204 |
| GET | `/cars/:carId/logs` | 200 paginated, newest `performedAt` first |
| POST | `/cars/:carId/logs` | 201 |
| GET / PATCH / DELETE | `/cars/:carId/logs/:logId` | 200 / 200 / 204 |
| GET | `/cars/:carId/reminders` | 200 paginated |
| POST | `/cars/:carId/reminders` | 201 |
| GET / PATCH / DELETE | `/cars/:carId/reminders/:reminderId` | 200 / 200 / 204 |
| GET | `/reminders/due` | 200 `{ data: [...] }` (not paginated) |

The `user` object never includes `passwordHash`.

### Auth

- Passwords hashed with `bcryptjs` (pure-JS bcrypt, no native build), cost from
  `BCRYPT_ROUNDS` (12 by default, 4 in tests for speed). Register requires `name`, valid
  `email`, and `password` of 8–72 characters (bcrypt ignores bytes past 72).
- Email is lower-cased and trimmed before saving and before lookup.
- Duplicate email on register → 409.
- Login with unknown email or wrong password → 401 with the same message for both.
- Token: JWT signed with `JWT_SECRET` (HS256), payload `{ sub: userId }`, expiry from
  `JWT_EXPIRES_IN` (default `7d`).
- `authenticate` middleware: missing, malformed, expired, or invalid token, or a token whose
  user no longer exists → 401. On success sets `req.user` (typed via a declaration merge on
  Express's `Request`).
- No logout endpoint in this stage; clients discard the token.

### Ownership

Every `/cars/:carId/...` route loads the car with `where: { id: carId, userId: req.user.id }`.
A car that doesn't exist or belongs to someone else → **404** (never 403). Nested log and
reminder lookups also filter by `carId`, so a log id from another car → 404.

### Odometer advancement

Creating or updating a CarLog whose `odometerAtService` is greater than the car's
`currentKm` sets `car.currentKm = odometerAtService`, in the same Prisma transaction as the
log write. A lower or equal reading leaves `currentKm` unchanged. Deleting a log never
lowers `currentKm`. `currentKm` can also be set directly via `PATCH /cars/:carId`.

### Due reminders

A reminder is due when all of the following hold:

- it belongs to a car owned by the caller,
- `notifiedAt IS NULL`,
- and either `remindOn <= CURRENT_DATE` or `cars.current_km >= reminders.remind_at_km`.

Implemented as one raw SQL query with `prisma.$queryRaw` (tagged template, so parameters
are escaped), because the km condition compares two columns across a join and Prisma's
query API can't express that. Results are ordered by `remindOn` ascending (nulls last),
then `id`. Each item includes its `carId` and a `dueBy` field: `"date"`, `"km"`, or
`"both"`.

Nothing in this stage sets `notifiedAt`. It can be set via `PATCH` so the due list can be
cleared; notifications in a later stage will set it automatically.

A `PATCH` that would leave a reminder with neither `remindOn` nor `remindAtKm` → 422.

## Request Flow and Errors

```
request → express.json() → authenticate → validate(schema) → controller → service → Prisma
                                                                  ↓ (throw)
                                                            errorHandler → JSON
```

- `validate(schema)` parses `req.body`, `req.params`, `req.query` with Zod and stores the
  parsed (coerced) values on `req.validated = { body, params, query }`, because Express 5
  makes `req.query` read-only. Controllers read only from `req.validated`. Failure → 422
  with Zod issues in `details`.
- `AppError(status, message, details?)` with subclasses `NotFoundError` (404),
  `UnauthorizedError` (401), `ConflictError` (409), `ValidationError` (422).
- `errorHandler` (registered last) maps `AppError` → its status, `ZodError` → 422, malformed
  JSON body → 400, unmatched route → 404 (an unknown path under `/api` without a token is
  401, because auth runs first, like a Laravel `auth:sanctum` route group), anything else → 500 with message
  `"Internal server error"` while logging the real error to stderr.
- Express 5 forwards rejected promises from async handlers to the error handler, so no
  per-controller `try/catch`.

Error shape (always):

```json
{ "error": { "message": "Car not found", "details": null } }
```

## Pagination

List endpoints accept `?page=` (default 1, min 1) and `?perPage=` (default 15, min 1,
max 100). Invalid values → 422. Response:

```json
{ "data": [], "meta": { "page": 1, "perPage": 15, "total": 0 } }
```

## Configuration

`src/config/env.ts` validates at startup:

- `DATABASE_URL` (required)
- `JWT_SECRET` (required, at least 32 characters)
- `JWT_EXPIRES_IN` (default `7d`)
- `BCRYPT_ROUNDS` (4–15, default `12`)
- `PORT` (default `3000`)
- `NODE_ENV` (`development` | `test` | `production`, default `development`)

Tests load `.env.test`, which points `DATABASE_URL` at `car_tracker_test`. The test setup
refuses to run if `DATABASE_URL` doesn't contain `_test`.

## npm Scripts

| Script | Does |
|---|---|
| `dev` | `tsx watch src/server.ts` |
| `build` | `tsc` to `dist/` |
| `start` | `node dist/server.js` |
| `typecheck` | `tsc --noEmit` |
| `pretest` | `prisma generate`, then apply migrations to the test DB |
| `test` | `vitest run` |
| `db:generate` | `prisma generate` |
| `db:migrate` | `prisma migrate dev && prisma generate` (Prisma 7 no longer generates on migrate) |
| `db:studio` | `prisma studio` |

## Testing

Vitest + Supertest feature tests against the real Express app and the
`car_tracker_test` database. `tests/setup.ts` truncates all tables before each test.
Tests run serially (one DB). Minimum coverage:

- **auth**: register success; duplicate email → 409; invalid body → 422; login success;
  wrong password → 401; `/auth/me` without token → 401; with invalid token → 401.
- **cars**: create, list (only own cars, pagination meta), show, update, delete; another
  user's car → 404 on show/update/delete.
- **car-logs**: CRUD; higher odometer raises `car.currentKm`; lower odometer doesn't;
  log under another user's car → 404.
- **reminders**: CRUD; create with neither `remindOn` nor `remindAtKm` → 422.
- **reminders/due**: due by date; due by km; due by both (`dueBy: "both"`); future date and
  km not reached → excluded; `notifiedAt` set → excluded; another user's due reminder →
  excluded.

Done means `npm run typecheck` and `npm test` both pass.

## Documentation

`README.md` covers: what the project is, prerequisites (Node 24, Docker), setup steps
(`npm install`, copy both env examples, `docker compose up -d`, `npm run db:migrate`,
`npm run dev`), running tests, and a short "Laravel → Node" mapping table for the concepts
used.

## Revisions

Changes made after approval, found while verifying the toolchain:

- Postgres **16** instead of 17: the 16 image is already on this machine, and Docker can't pull
  new images here (`~/.docker/config.json` names a `desktop` credential helper that isn't installed).
- Host port **5434**: 5432 and 5433 are already used by other Postgres instances on this machine.
- **`bcryptjs`** instead of `bcrypt`: same algorithm, but no native addon or install script.
- Added `BCRYPT_ROUNDS`, the `/api/health` route, `ValidationError`, and the reminder PATCH rule.
