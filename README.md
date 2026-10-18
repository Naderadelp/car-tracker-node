# car-tracker-node

A Node.js + Express + TypeScript port of my Laravel [car-tracker](https://github.com/Naderadelp/car-tracker) API,
built as my first Node project. Stage 1 covers auth, cars, odometer/service logs and reminders,
including the "due by date **or** by kilometers" check.

## Stack

Node 24 · Express 5 · TypeScript · PostgreSQL 16 (Docker) · Prisma 7 · Zod · JWT · Vitest + Supertest

## Setup

Prerequisites: Node 24+, Docker.

```bash
npm install
cp .env.example .env
cp .env.test.example .env.test
docker compose up -d          # Postgres on localhost:5434 (car_tracker + car_tracker_test)
npm run db:migrate            # apply migrations + generate the Prisma client
npm run dev                   # http://localhost:3000/api/health
```

## Tests

```bash
npm test          # migrates the test database, then runs every *.test.ts
npm run typecheck
```

Tests run against `car_tracker_test` and empty every table before each test.

## API

All routes are under `/api`. Everything except `health`, `auth/register` and `auth/login`
needs `Authorization: Bearer <token>`.

| Method | Path |
|---|---|
| GET | `/health` |
| POST | `/auth/register`, `/auth/login` |
| GET | `/auth/me` |
| GET, POST | `/cars` |
| GET, PATCH, DELETE | `/cars/:carId` |
| GET, POST | `/cars/:carId/logs` |
| GET, PATCH, DELETE | `/cars/:carId/logs/:logId` |
| GET, POST | `/cars/:carId/reminders` |
| GET, PATCH, DELETE | `/cars/:carId/reminders/:reminderId` |
| GET | `/reminders/due` |

Lists take `?page=` and `?perPage=` (max 100). Errors always look like
`{ "error": { "message": "...", "details": ... } }`.

## Laravel → Node cheat sheet

| Laravel | Here |
|---|---|
| `routes/api.php` | `src/app.ts` + `*.routes.ts` |
| Controller | `*.controller.ts` (HTTP only) |
| Service / Repository | `*.service.ts` (logic + Prisma) |
| FormRequest `rules()` | Zod schema in `*.schemas.ts` + `validate()` middleware |
| Eloquent model + migrations | `prisma/schema.prisma` + `prisma migrate dev` |
| `$fillable` | `z.object()` strips unknown keys |
| `$hidden` | `publicUserSelect` |
| `auth:sanctum` | `authenticate` middleware (JWT) |
| `$request->user()` | `currentUser(req)` |
| `Handler.php` / exceptions | `AppError` + `error-handler.ts` |
| `RefreshDatabase` | `tests/setup.ts` (TRUNCATE before each test) |
| `whereColumn` inside `whereHas` | raw SQL in `due-reminders.service.ts` |
| `php artisan serve` | `npm run dev` |
