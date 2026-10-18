# car-tracker-node Stage 1 (Core Slice) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new Node.js + Express + TypeScript API at `~/Desktop/studing/car-tracker-node` with auth, cars, car logs (odometer) and reminders, including the due-by-date-or-km query, all covered by feature tests, and pushed to `github.com/Naderadelp/car-tracker-node`.

**Architecture:** Feature folders under `src/modules/<feature>/` with routes → controller (HTTP only) → service (logic + Prisma). Cross-cutting pieces live in `src/lib` (errors, pagination, shared Zod schemas) and `src/middleware` (authenticate, validate, error handler). One `api` router in `src/app.ts` mounts the modules, with `authenticate` applied once in front of every protected route.

**Tech Stack:** Node 24, Express 5, TypeScript 7 (ES modules, `.ts` import extensions), PostgreSQL 16 via Docker Compose, Prisma 7 (`prisma-client` generator + `@prisma/adapter-pg`), Zod 4, jsonwebtoken, bcryptjs, Vitest 5 + Supertest.

**Spec:** `docs/superpowers/specs/2026-10-18-car-tracker-node-core-design.md` (copied into the new repo in Task 1). Read it alongside this plan.

**Developer context:** This is the developer's first Node project; they come from PHP/Laravel. Code comments point out the Laravel equivalent where it helps. Keep that style.

**Verified:** Every file in this plan was built and run in a scratch copy on 2026-10-18 (typecheck clean, 42/42 tests passing, `npm run build` + `npm start` smoke-tested). If something fails, check the step order before rewriting code.

## Global Constraints

- Project root: `/home/nader/Desktop/studing/car-tracker-node`. Never modify `/home/nader/Desktop/studing/car-tracker` (the Laravel repo), except removing the two copied docs in Task 1.
- Node ≥ 24; `"type": "module"`; every relative import ends in `.ts` (e.g. `import { env } from './config/env.ts'`).
- Package versions exactly as in Task 2's `package.json`; don't upgrade or add dependencies.
- `erasableSyntaxOnly` is on, so no TypeScript `enum`s, `namespace`s with values, or constructor parameter properties.
- Postgres: `postgres:16` image, host port `127.0.0.1:5434`, user/password `app`/`app`, databases `car_tracker` and `car_tracker_test`.
- Response shapes: single item `{ "data": {...} }`; list `{ "data": [...], "meta": { "page", "perPage", "total" } }`; error `{ "error": { "message", "details" } }`.
- Someone else's car/log/reminder → **404**, never 403.
- Controllers never import Prisma; services never touch `req`/`res`.
- Commits made by the executor end with the trailer `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`. The developer's own "first commit" in Task 1 is run exactly as given.
- Work after Task 1's first push happens on branch `stage-1-core`.

## Review Focus

Inputs the spec implies but doesn't spell out, most likely first. Each has a pinned test in its owning task:

1. **Mass assignment:** a `POST /cars` body containing someone else's `userId` must still create the car for the caller (Task 5, "ignoring a userId in the body").
2. **Clearing both reminder triggers:** `PATCH { "remindAtKm": null }` on a km-only reminder must be 422, not a reminder that can never fire (Task 7).
3. **Malformed JSON body:** must be 400 with the JSON error shape, not a 500 (Task 3).
4. **Email casing:** `Nader@Example.com` must collide with `nader@example.com` on register and log in to the same account (Task 4).
5. **Boundaries of "due":** `remindOn` = today and `currentKm` = `remindAtKm` exactly are both due (Task 8, "dated today" and the `remindAtKm: 60000` vs `currentKm: 60000` case).

---

### Task 1: Create the repo and push the first commit

**Files:**
- Create: `/home/nader/Desktop/studing/car-tracker-node/README.md`
- Create (copy): `docs/superpowers/specs/2026-10-18-car-tracker-node-core-design.md`, `docs/superpowers/plans/2026-10-18-car-tracker-node-core.md`
- Delete (originals, untracked): the same two files under `/home/nader/Desktop/studing/car-tracker/docs/superpowers/`

**Interfaces:** none.

- [ ] **Step 1: Confirm the target doesn't exist and the GitHub repo is empty**

```bash
ls -d /home/nader/Desktop/studing/car-tracker-node 2>&1
gh repo view Naderadelp/car-tracker-node --json isEmpty
```

Expected: `No such file or directory`, then `{"isEmpty":true}`. If either differs, stop and ask the developer.

- [ ] **Step 2: Run the developer's commands exactly**

```bash
cd /home/nader/Desktop/studing
mkdir car-tracker-node
cd car-tracker-node
echo "# car-tracker-node" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/Naderadelp/car-tracker-node.git
git push -u origin main
```

Expected: the push ends with `branch 'main' set up to track 'origin/main'`.

- [ ] **Step 3: Verify the remote has the commit**

```bash
git -C /home/nader/Desktop/studing/car-tracker-node ls-remote origin main
git -C /home/nader/Desktop/studing/car-tracker-node rev-parse HEAD
```

Expected: both print the same hash.

- [ ] **Step 4: Start the feature branch and move the spec and plan in**

```bash
cd /home/nader/Desktop/studing/car-tracker-node
git checkout -b stage-1-core
mkdir -p docs/superpowers/specs docs/superpowers/plans
mv /home/nader/Desktop/studing/car-tracker/docs/superpowers/specs/2026-10-18-car-tracker-node-core-design.md docs/superpowers/specs/
mv /home/nader/Desktop/studing/car-tracker/docs/superpowers/plans/2026-10-18-car-tracker-node-core.md docs/superpowers/plans/
rmdir /home/nader/Desktop/studing/car-tracker/docs/superpowers/specs /home/nader/Desktop/studing/car-tracker/docs/superpowers/plans /home/nader/Desktop/studing/car-tracker/docs/superpowers
git -C /home/nader/Desktop/studing/car-tracker status --short
```

Expected: the last command prints nothing (the Laravel repo is clean again). From here on, this plan lives at `docs/superpowers/plans/2026-10-18-car-tracker-node-core.md` inside `car-tracker-node`. If `rmdir` fails because the directory isn't empty, leave it and tell the developer what else is in it.

- [ ] **Step 5: Commit**

```bash
git add docs
git commit -m "docs: add stage 1 design spec and implementation plan" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Tooling, database and Prisma schema

The deliverable is a running Postgres with all four tables migrated, a generated Prisma client, and a clean typecheck. No HTTP yet.

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `.gitignore`, `docker-compose.yml`, `docker/init-test-db.sql`, `.env.example`, `.env.test.example`, `prisma.config.ts`, `prisma/schema.prisma`, `vitest.config.ts`, `src/config/env.ts`, `src/lib/prisma.ts`
- Generated: `prisma/migrations/<timestamp>_init/migration.sql` (committed), `src/generated/prisma/` (gitignored)

**Interfaces:**
- Produces: `env` from `src/config/env.ts` with `{ NODE_ENV, PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS }`; `prisma` (a `PrismaClient`) from `src/lib/prisma.ts`; models `User`, `Car`, `CarLog`, `Reminder` with the fields in `schema.prisma` below; `Prisma` namespace from `src/generated/prisma/client.ts`.

All commands run in `/home/nader/Desktop/studing/car-tracker-node`.

- [ ] **Step 1: Write `package.json`**

`allowScripts` is npm 11's install-script allowlist. Without it npm skips Prisma's engine download and `prisma migrate` fails.

`package.json`:

```json
{
  "name": "car-tracker-node",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "dev": "tsx watch --env-file=.env src/server.ts",
    "build": "tsc -p tsconfig.build.json",
    "start": "node --env-file=.env dist/server.js",
    "typecheck": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev && prisma generate",
    "db:studio": "prisma studio",
    "pretest": "prisma generate && NODE_ENV=test prisma migrate deploy",
    "test": "vitest run"
  },
  "dependencies": {
    "@prisma/adapter-pg": "^7.10.1",
    "@prisma/client": "^7.10.1",
    "bcryptjs": "^3.0.3",
    "express": "^5.3.0",
    "jsonwebtoken": "^9.0.3",
    "zod": "^4.6.7"
  },
  "devDependencies": {
    "@types/express": "^5.0.6",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^24.19.2",
    "@types/supertest": "^7.2.1",
    "prisma": "^7.10.1",
    "supertest": "^7.3.1",
    "tsx": "^4.23.15",
    "typescript": "^7.0.2",
    "vitest": "^5.0.5"
  },
  "allowScripts": {
    "prisma": true,
    "@prisma/engines": true,
    "esbuild": true
  }
}
```

- [ ] **Step 2: Install**

```bash
npm install
npm install-scripts ls
```

Expected: install finishes with `found 0 vulnerabilities`, and `install-scripts ls` reports nothing left uncovered.

- [ ] **Step 3: TypeScript config**

`tsconfig.json` is for type-checking everything (`noEmit`); `tsconfig.build.json` compiles only `src` (minus tests) to `dist`. `rewriteRelativeImportExtensions` turns `./x.ts` imports into `./x.js` in the build output.

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2023",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "rewriteRelativeImportExtensions": true,
    "erasableSyntaxOnly": true,
    "types": ["node"]
  },
  "include": ["src", "tests", "prisma.config.ts", "vitest.config.ts"]
}
```

`tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}
```

`.gitignore`:

```text
node_modules/
dist/
.env
.env.test
src/generated/
```

- [ ] **Step 4: Docker Compose**

The init script runs only when the volume is first created, and makes the second (test) database.

`docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: car_tracker
    ports:
      - "127.0.0.1:5434:5432"
    volumes:
      - db-data:/var/lib/postgresql/data
      - ./docker/init-test-db.sql:/docker-entrypoint-initdb.d/init-test-db.sql:ro

volumes:
  db-data:
```

`docker/init-test-db.sql`:

```sql
CREATE DATABASE car_tracker_test;
```

- [ ] **Step 5: Env files**

`.env.example`:

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://app:app@localhost:5434/car_tracker
JWT_SECRET=change-me-to-a-random-string-of-at-least-32-chars
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

`.env.test.example`:

```dotenv
NODE_ENV=test
DATABASE_URL=postgresql://app:app@localhost:5434/car_tracker_test
JWT_SECRET=test-secret-test-secret-test-secret-123
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=4
```

```bash
cp .env.example .env
cp .env.test.example .env.test
```

- [ ] **Step 6: Prisma config and schema**

Prisma 7 reads the database URL from `prisma.config.ts`, not from the schema file.

`prisma.config.ts`:

```ts
import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// The Prisma CLI doesn't read .env by itself. Load .env, or .env.test when NODE_ENV=test,
// so `prisma migrate` talks to the right database.
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
if (existsSync(envFile)) process.loadEnvFile(envFile);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL },
});
```

`@map`/`@@map` keep database names snake_case (like Laravel) while the TypeScript fields are camelCase.

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id           Int      @id @default(autoincrement())
  name         String
  email        String   @unique
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  cars         Car[]

  @@map("users")
}

model Car {
  id          Int        @id @default(autoincrement())
  userId      Int        @map("user_id")
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  make        String
  model       String
  color       String?
  currentKm   Int        @default(0) @map("current_km")
  tankSize    Decimal?   @map("tank_size") @db.Decimal(6, 2)
  purchasedAt DateTime?  @map("purchased_at") @db.Date
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  logs        CarLog[]
  reminders   Reminder[]

  @@index([userId])
  @@map("cars")
}

model CarLog {
  id                Int      @id @default(autoincrement())
  carId             Int      @map("car_id")
  car               Car      @relation(fields: [carId], references: [id], onDelete: Cascade)
  title             String
  category          String?
  odometerAtService Int      @map("odometer_at_service")
  actualCost        Decimal? @map("actual_cost") @db.Decimal(10, 2)
  performedAt       DateTime @map("performed_at") @db.Date
  notes             String?
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  @@index([carId])
  @@map("car_logs")
}

model Reminder {
  id          Int       @id @default(autoincrement())
  carId       Int       @map("car_id")
  car         Car       @relation(fields: [carId], references: [id], onDelete: Cascade)
  title       String
  description String?
  remindOn    DateTime? @map("remind_on") @db.Date
  remindAtKm  Int?      @map("remind_at_km")
  notifiedAt  DateTime? @map("notified_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@index([carId])
  @@map("reminders")
}
```

- [ ] **Step 7: Env loader, Prisma client and Vitest config**

`src/config/env.ts`:

```ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
});

// Parsed once at startup: a missing or invalid variable crashes the app immediately
// instead of failing later in the middle of a request.
export const env = envSchema.parse(process.env);
```

`src/lib/prisma.ts`:

```ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.ts';
import { env } from '../config/env.ts';

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});
```

`vitest.config.ts`:

```ts
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tests always run against the test database from .env.test.
    env: parseEnv(readFileSync('.env.test', 'utf8')) as Record<string, string>,
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.ts'],
    // One shared database, so test files must not run at the same time.
    fileParallelism: false,
  },
});
```

- [ ] **Step 8: Start Postgres and run the first migration**

```bash
docker compose up -d
sleep 5
docker compose exec db psql -U app -d postgres -tAc "SELECT datname FROM pg_database WHERE datname LIKE 'car_tracker%' ORDER BY 1"
npx prisma migrate dev --name init
npx prisma generate
```

Expected: psql prints `car_tracker` and `car_tracker_test`; migrate prints `Applying migration ..._init` and `Your database is now in sync with your schema.`; generate prints `Generated Prisma Client (7.10.1)`. (Later schema changes use `npm run db:migrate`, which does both.)

If `docker compose up` says it can't pull `postgres:16` with a `docker-credential-desktop` error, the image is missing locally. Stop and tell the developer (their `~/.docker/config.json` has `"credsStore": "desktop"`). If the port is in use, stop and report which port.

- [ ] **Step 9: Typecheck**

```bash
npm run typecheck
```

Expected: no output, exit code 0.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.build.json .gitignore docker-compose.yml docker .env.example .env.test.example prisma.config.ts prisma vitest.config.ts src
git commit -m "chore: scaffold TypeScript, Prisma schema and Postgres via Docker" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

Check `git status --short` afterwards: `.env`, `.env.test`, `node_modules/` and `src/generated/` must **not** be committed.

---

### Task 3: Express app skeleton, validation and error handling

**Files:**
- Create: `src/lib/errors.ts`, `src/lib/schemas.ts`, `src/lib/pagination.ts`, `src/types/express.d.ts`, `src/middleware/validate.ts`, `src/middleware/error-handler.ts`, `src/app.ts`, `src/server.ts`, `tests/setup.ts`
- Test: `src/app.test.ts`

**Interfaces:**
- Consumes: `env`, `prisma` (Task 2).
- Produces:
  - `AppError(status: number, message: string, details?: unknown)` plus `NotFoundError(message?)` 404, `UnauthorizedError(message?)` 401, `ConflictError(message)` 409, `ValidationError(message, details?)` 422, all from `src/lib/errors.ts`
  - `isoDate` (Zod: `"YYYY-MM-DD"` → `Date`) and `id` (Zod: coerces a positive int) from `src/lib/schemas.ts`
  - `paginationQuery`, `type Pagination = { page: number; perPage: number }`, `toSkipTake(p) → { skip, take }`, `paginated(data, total, p) → { data, meta }` from `src/lib/pagination.ts`
  - `validate({ body?, params?, query? }): RequestHandler` sets `req.validated = { body, params, query }`
  - `errorHandler`; `app` (Express app) from `src/app.ts`, which later tasks extend
  - `tests/setup.ts` truncates all tables before every test

- [ ] **Step 1: Write the failing test**

`src/app.test.ts`:

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './app.ts';

describe('app', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('unknown routes outside /api return the JSON 404 shape', async () => {
    const res = await request(app).get('/nope');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: 'Route not found', details: null } });
  });

  it('malformed JSON returns 400, not 500', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Malformed JSON body');
  });
});
```

- [ ] **Step 2: Run it to see it fail**

```bash
npm test
```

Expected: FAIL, because `src/app.test.ts` can't import `./app.ts` (the file doesn't exist). The `pretest` migration step itself should succeed.

- [ ] **Step 3: Errors, shared schemas, pagination**

`src/lib/errors.ts`:

```ts
export class AppError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, message: string, details: unknown = null) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthenticated') {
    super(401, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: unknown = null) {
    super(422, message, details);
  }
}
```

`src/lib/schemas.ts`:

```ts
import { z } from 'zod';

// "2026-10-18" -> Date at UTC midnight, which is what Prisma expects for @db.Date columns.
export const isoDate = z.iso.date().transform((value) => new Date(value));

export const id = z.coerce.number().int().positive();
```

`src/lib/pagination.ts`:

```ts
import { z } from 'zod';

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(15),
});

export type Pagination = z.infer<typeof paginationQuery>;

export function toSkipTake({ page, perPage }: Pagination) {
  return { skip: (page - 1) * perPage, take: perPage };
}

export function paginated<T>(data: T[], total: number, { page, perPage }: Pagination) {
  return { data, meta: { page, perPage, total } };
}
```

- [ ] **Step 4: Request typing, validate middleware, error handler**

This is the Task 3 version of `express.d.ts`. Task 4 adds `user`.

`src/types/express.d.ts`:

```ts
declare global {
  namespace Express {
    interface Request {
      // Set by the validate middleware: the parsed and coerced request input.
      validated: { body: unknown; params: unknown; query: unknown };
    }
  }
}

export {};
```

`src/middleware/validate.ts`:

```ts
import type { RequestHandler } from 'express';
import type { z } from 'zod';

type Schemas = { body?: z.ZodType; params?: z.ZodType; query?: z.ZodType };

// Like a Laravel FormRequest: parse the input, or throw a ZodError that the error
// handler turns into a 422. Express 5 makes req.query read-only, so the parsed values
// go on req.validated instead of replacing the originals.
export function validate(schemas: Schemas): RequestHandler {
  return (req, _res, next) => {
    req.validated = {
      body: schemas.body ? schemas.body.parse(req.body) : undefined,
      params: schemas.params ? schemas.params.parse(req.params) : undefined,
      query: schemas.query ? schemas.query.parse(req.query) : undefined,
    };
    next();
  };
}
```

`src/middleware/error-handler.ts`:

```ts
import type { ErrorRequestHandler, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/errors.ts';

function sendError(res: Response, status: number, message: string, details: unknown = null) {
  res.status(status).json({ error: { message, details } });
}

// Errors raised by Express itself (e.g. body-parser) carry a status and `expose: true`.
function isClientHttpError(err: unknown): err is { status: number; message: string; type?: string } {
  if (typeof err !== 'object' || err === null) return false;
  const { status, expose } = err as { status?: unknown; expose?: unknown };
  return typeof status === 'number' && status >= 400 && status < 500 && expose === true;
}

// Registered last in app.ts. Express 5 sends every thrown error (sync or async) here.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    sendError(res, err.status, err.message, err.details);
  } else if (err instanceof z.ZodError) {
    sendError(res, 422, 'Validation failed', z.flattenError(err));
  } else if (isClientHttpError(err)) {
    const message = err.type === 'entity.parse.failed' ? 'Malformed JSON body' : err.message;
    sendError(res, err.status, message);
  } else {
    console.error(err);
    sendError(res, 500, 'Internal server error');
  }
};
```

- [ ] **Step 5: App, server and test setup**

`src/app.ts`:

```ts
import express, { Router } from 'express';
import { NotFoundError } from './lib/errors.ts';
import { errorHandler } from './middleware/error-handler.ts';

export const app = express();

app.use(express.json());

const api = Router();

api.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', api);

app.use(() => {
  throw new NotFoundError('Route not found');
});
app.use(errorHandler);
```

`src/server.ts`:

```ts
import { app } from './app.ts';
import { env } from './config/env.ts';

app.listen(env.PORT, () => {
  console.log(`car-tracker-node listening on http://localhost:${env.PORT}`);
});
```

`tests/setup.ts`:

```ts
import { afterAll, beforeEach } from 'vitest';
import { env } from '../src/config/env.ts';
import { prisma } from '../src/lib/prisma.ts';

// Safety net: never wipe a database that isn't the test one.
if (!env.DATABASE_URL.includes('_test')) {
  throw new Error(`Refusing to run tests against ${env.DATABASE_URL}`);
}

// Like Laravel's RefreshDatabase: every test starts with empty tables.
beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE reminders, car_logs, cars, users RESTART IDENTITY CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

- [ ] **Step 6: Run the tests and typecheck**

```bash
npm test && npm run typecheck
```

Expected: `Test Files  1 passed (1)`, `Tests  3 passed (3)`; typecheck silent.

- [ ] **Step 7: Try it by hand**

```bash
npm run dev
```

In a second terminal, `curl -s localhost:3000/api/health` should print `{"status":"ok"}`. Stop the dev server with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add src tests
git commit -m "feat: add Express app skeleton with validation and JSON error handling" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Auth (register, login, me) with JWT

**Files:**
- Create: `src/modules/auth/auth.schemas.ts`, `src/modules/auth/token.ts`, `src/modules/auth/auth.service.ts`, `src/modules/auth/auth.controller.ts`, `src/modules/auth/auth.routes.ts`, `src/middleware/authenticate.ts`, `tests/helpers.ts`
- Modify: `src/types/express.d.ts` (add `user`), `src/app.ts` (mount `/auth`)
- Test: `src/modules/auth/auth.test.ts`

**Interfaces:**
- Consumes: `prisma`, `env`, errors, `validate` (Tasks 2–3).
- Produces:
  - `type PublicUser = { id: number; name: string; email: string; createdAt: Date; updatedAt: Date }` and `publicUserSelect` from `auth.service.ts`
  - `register(input) → Promise<{ user: PublicUser; token: string }>`, `login(input)` (same return type), `findPublicUser(id) → Promise<PublicUser | null>`
  - `signToken(userId: number): string`, `verifyToken(token: string): number | null` from `token.ts`
  - `authenticate: RequestHandler` and `currentUser(req): PublicUser` from `src/middleware/authenticate.ts`
  - Test helper `createUser(overrides?) → Promise<{ user: PublicUser; token: string; auth: string }>` where `auth` is `"Bearer <token>"`

- [ ] **Step 1: Write the test helper and the failing tests**

This is the Task 4 version of `tests/helpers.ts`. Task 5 adds `createCar`.

`tests/helpers.ts`:

```ts
import { register } from '../src/modules/auth/auth.service.ts';

let counter = 0;

// Creates a user through the real register logic and returns a ready-to-use auth header.
export async function createUser(overrides: { name?: string; email?: string; password?: string } = {}) {
  counter += 1;
  const { user, token } = await register({
    name: overrides.name ?? `User ${counter}`,
    email: overrides.email ?? `user${counter}@example.com`,
    password: overrides.password ?? 'password123',
  });
  return { user, token, auth: `Bearer ${token}` };
}
```

`src/modules/auth/auth.test.ts`:

```ts
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createUser } from '../../../tests/helpers.ts';
import { app } from '../../app.ts';
import { prisma } from '../../lib/prisma.ts';

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token without the password hash', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Nader', email: 'nader@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ name: 'Nader', email: 'nader@example.com' });
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(typeof res.body.data.token).toBe('string');
  });

  it('normalises the email to lower case', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Nader', email: '  Nader@Example.COM ', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('nader@example.com');
  });

  it('rejects a duplicate email with 409, even with different casing', async () => {
    await createUser({ email: 'taken@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other', email: 'TAKEN@example.com', password: 'password123' });

    expect(res.status).toBe(409);
  });

  it('rejects an invalid body with 422 and field errors', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(422);
    expect(Object.keys(res.body.error.details.fieldErrors).sort()).toEqual(['email', 'name', 'password']);
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token for the right password', async () => {
    await createUser({ email: 'nader@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'Nader@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('nader@example.com');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(typeof res.body.data.token).toBe('string');
  });

  it('returns the same 401 for a wrong password and an unknown email', async () => {
    await createUser({ email: 'nader@example.com', password: 'password123' });

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nader@example.com', password: 'wrong-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user', async () => {
    const { user, auth } = await createUser();

    const res = await request(app).get('/api/auth/me').set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: user.id, email: user.email });
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  it('returns 401 for a garbage token and for a non-Bearer scheme', async () => {
    const { token } = await createUser();

    const garbage = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.jwt');
    const basic = await request(app).get('/api/auth/me').set('Authorization', `Basic ${token}`);

    expect(garbage.status).toBe(401);
    expect(basic.status).toBe(401);
  });

  it('returns 401 when the token belongs to a deleted user', async () => {
    const { user, auth } = await createUser();
    await prisma.user.delete({ where: { id: user.id } });

    const res = await request(app).get('/api/auth/me').set('Authorization', auth);

    expect(res.status).toBe(401);
  });

  it('returns 401 for a token signed with a different secret', async () => {
    const { user } = await createUser();
    const forged = jwt.sign({}, 'some-other-secret-that-is-long-enough!!', { subject: String(user.id) });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);

    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
npm test -- src/modules/auth
```

Expected: FAIL, because `tests/helpers.ts` can't import `src/modules/auth/auth.service.ts`.

- [ ] **Step 3: Schemas, token helpers and service**

`src/modules/auth/auth.schemas.ts`:

```ts
import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email());

export const registerBody = z.object({
  name: z.string().trim().min(1).max(100),
  email,
  // bcrypt only looks at the first 72 bytes, so longer passwords are rejected.
  password: z.string().min(8).max(72),
});

export const loginBody = z.object({
  email,
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerBody>;
export type LoginInput = z.infer<typeof loginBody>;
```

`src/modules/auth/token.ts`:

```ts
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.ts';

export function signToken(userId: number): string {
  return jwt.sign({}, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: String(userId),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

// Returns the user id, or null for any missing, expired, tampered or malformed token.
export function verifyToken(token: string): number | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string') return null;
    const userId = Number(payload.sub);
    return Number.isInteger(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
}
```

`src/modules/auth/auth.service.ts`:

```ts
import bcrypt from 'bcryptjs';
import { env } from '../../config/env.ts';
import { Prisma } from '../../generated/prisma/client.ts';
import { ConflictError, UnauthorizedError } from '../../lib/errors.ts';
import { prisma } from '../../lib/prisma.ts';
import type { LoginInput, RegisterInput } from './auth.schemas.ts';
import { signToken } from './token.ts';

// Every column except passwordHash. Like $hidden on a Laravel model, but explicit per query.
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError('Email is already registered');

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
  try {
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash },
      select: publicUserSelect,
    });
    return { user, token: signToken(user.id) };
  } catch (err) {
    // Two registrations with the same email at the same moment: the unique index wins.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('Email is already registered');
    }
    throw err;
  }
}

export async function login(input: LoginInput) {
  const found = await prisma.user.findUnique({ where: { email: input.email } });
  // Same error for "no such user" and "wrong password", so the API doesn't reveal which emails exist.
  if (!found || !(await bcrypt.compare(input.password, found.passwordHash))) {
    throw new UnauthorizedError('Invalid email or password');
  }
  const { passwordHash: _passwordHash, ...user } = found;
  return { user, token: signToken(user.id) };
}

export function findPublicUser(id: number) {
  return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
}
```

- [ ] **Step 4: authenticate middleware and request typing**

`src/middleware/authenticate.ts`:

```ts
import type { Request, RequestHandler } from 'express';
import { UnauthorizedError } from '../lib/errors.ts';
import { findPublicUser, type PublicUser } from '../modules/auth/auth.service.ts';
import { verifyToken } from '../modules/auth/token.ts';

// Like `auth:sanctum`: reject the request unless it carries a valid Bearer token.
export const authenticate: RequestHandler = async (req, _res, next) => {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new UnauthorizedError();

  const userId = verifyToken(token);
  if (userId === null) throw new UnauthorizedError();

  const user = await findPublicUser(userId);
  if (!user) throw new UnauthorizedError();

  req.user = user;
  next();
};

// Like $request->user(), for routes behind authenticate.
export function currentUser(req: Request): PublicUser {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}
```

Replace `src/types/express.d.ts` with the final version:

`src/types/express.d.ts`:

```ts
import type { PublicUser } from '../modules/auth/auth.service.ts';

declare global {
  namespace Express {
    interface Request {
      // Set by the authenticate middleware.
      user?: PublicUser;
      // Set by the validate middleware: the parsed and coerced request input.
      validated: { body: unknown; params: unknown; query: unknown };
    }
  }
}

export {};
```

- [ ] **Step 5: Controller, routes, and mounting**

`src/modules/auth/auth.controller.ts`:

```ts
import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/authenticate.ts';
import type { LoginInput, RegisterInput } from './auth.schemas.ts';
import * as authService from './auth.service.ts';

export async function register(req: Request, res: Response) {
  const result = await authService.register(req.validated.body as RegisterInput);
  res.status(201).json({ data: result });
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.validated.body as LoginInput);
  res.json({ data: result });
}

export function me(req: Request, res: Response) {
  res.json({ data: currentUser(req) });
}
```

`src/modules/auth/auth.routes.ts`:

```ts
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.ts';
import { validate } from '../../middleware/validate.ts';
import * as controller from './auth.controller.ts';
import { loginBody, registerBody } from './auth.schemas.ts';

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerBody }), controller.register);
authRouter.post('/login', validate({ body: loginBody }), controller.login);
authRouter.get('/me', authenticate, controller.me);
```

Replace `src/app.ts`:

`src/app.ts`:

```ts
import express, { Router } from 'express';
import { NotFoundError } from './lib/errors.ts';
import { errorHandler } from './middleware/error-handler.ts';
import { authRouter } from './modules/auth/auth.routes.ts';

export const app = express();

app.use(express.json());

const api = Router();

api.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
api.use('/auth', authRouter);

app.use('/api', api);

app.use(() => {
  throw new NotFoundError('Route not found');
});
app.use(errorHandler);
```

- [ ] **Step 6: Run the tests and typecheck**

```bash
npm test && npm run typecheck
```

Expected: `Test Files  2 passed (2)`, `Tests  14 passed (14)`; typecheck silent.

- [ ] **Step 7: Commit**

```bash
git add src tests
git commit -m "feat: add register, login and me endpoints with JWT auth" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Cars CRUD with ownership

**Files:**
- Create: `src/modules/cars/cars.schemas.ts`, `src/modules/cars/cars.service.ts`, `src/modules/cars/cars.controller.ts`, `src/modules/cars/cars.routes.ts`
- Modify: `tests/helpers.ts` (add `createCar`), `src/app.ts` (auth gate + `/cars`)
- Test: `src/modules/cars/cars.test.ts`

**Interfaces:**
- Consumes: `currentUser`, `authenticate`, `validate`, `paginationQuery`, `paginated`, `toSkipTake`, `isoDate`, `id`, `NotFoundError`, `createUser`.
- Produces:
  - `carParams` (Zod `{ carId }`) and `type CarParams = { carId: number }` from `cars.schemas.ts`. Logs and reminders reuse these.
  - `findOwnedCar(userId: number, carId: number) → Promise<Car>`, which throws `NotFoundError('Car not found')`. **Every nested route uses it for the ownership check.**
  - `listCars`, `createCar`, `updateCar`, `deleteCar` from `cars.service.ts`
  - Test helper `createCar(userId: number, data?: { currentKm?: number }) → Promise<Car>` (make Toyota, model Corolla)

- [ ] **Step 1: Add the helper and write the failing tests**

Replace `tests/helpers.ts` with the final version:

`tests/helpers.ts`:

```ts
import { prisma } from '../src/lib/prisma.ts';
import { register } from '../src/modules/auth/auth.service.ts';

let counter = 0;

// Creates a user through the real register logic and returns a ready-to-use auth header.
export async function createUser(overrides: { name?: string; email?: string; password?: string } = {}) {
  counter += 1;
  const { user, token } = await register({
    name: overrides.name ?? `User ${counter}`,
    email: overrides.email ?? `user${counter}@example.com`,
    password: overrides.password ?? 'password123',
  });
  return { user, token, auth: `Bearer ${token}` };
}

export function createCar(userId: number, data: { currentKm?: number } = {}) {
  return prisma.car.create({
    data: { userId, make: 'Toyota', model: 'Corolla', currentKm: data.currentKm ?? 0 },
  });
}
```

`src/modules/cars/cars.test.ts`:

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCar, createUser } from '../../../tests/helpers.ts';
import { app } from '../../app.ts';

describe('cars', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/cars');

    expect(res.status).toBe(401);
  });

  it('creates a car for the current user, ignoring a userId in the body', async () => {
    const { user, auth } = await createUser();
    const other = await createUser();

    const res = await request(app)
      .post('/api/cars')
      .set('Authorization', auth)
      .send({
        make: 'Toyota',
        model: 'Corolla',
        color: 'White',
        currentKm: 42000,
        tankSize: 50.5,
        purchasedAt: '2022-03-15',
        userId: other.user.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      userId: user.id,
      make: 'Toyota',
      model: 'Corolla',
      color: 'White',
      currentKm: 42000,
      tankSize: '50.5',
      purchasedAt: '2022-03-15T00:00:00.000Z',
    });
  });

  it('defaults currentKm to 0', async () => {
    const { auth } = await createUser();

    const res = await request(app).post('/api/cars').set('Authorization', auth).send({ make: 'Kia', model: 'Rio' });

    expect(res.status).toBe(201);
    expect(res.body.data.currentKm).toBe(0);
  });

  it('rejects an invalid car with 422', async () => {
    const { auth } = await createUser();

    const res = await request(app)
      .post('/api/cars')
      .set('Authorization', auth)
      .send({ make: '', currentKm: -5, purchasedAt: '2022-13-45' });

    expect(res.status).toBe(422);
    expect(Object.keys(res.body.error.details.fieldErrors).sort()).toEqual([
      'currentKm',
      'make',
      'model',
      'purchasedAt',
    ]);
  });

  it('lists only my cars, paginated', async () => {
    const { user, auth } = await createUser();
    const other = await createUser();
    for (let i = 0; i < 3; i++) await createCar(user.id);
    await createCar(other.user.id);

    const res = await request(app).get('/api/cars?page=2&perPage=2').set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ page: 2, perPage: 2, total: 3 });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].userId).toBe(user.id);
  });

  it('rejects perPage over 100 and page 0 with 422', async () => {
    const { auth } = await createUser();

    const tooBig = await request(app).get('/api/cars?perPage=101').set('Authorization', auth);
    const zero = await request(app).get('/api/cars?page=0').set('Authorization', auth);

    expect(tooBig.status).toBe(422);
    expect(zero.status).toBe(422);
  });

  it('shows, updates and deletes my car', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id, { currentKm: 1000 });

    const shown = await request(app).get(`/api/cars/${car.id}`).set('Authorization', auth);
    expect(shown.status).toBe(200);
    expect(shown.body.data.id).toBe(car.id);

    const updated = await request(app)
      .patch(`/api/cars/${car.id}`)
      .set('Authorization', auth)
      .send({ color: 'Red' });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ color: 'Red', currentKm: 1000, make: 'Toyota' });

    const deleted = await request(app).delete(`/api/cars/${car.id}`).set('Authorization', auth);
    expect(deleted.status).toBe(204);

    const gone = await request(app).get(`/api/cars/${car.id}`).set('Authorization', auth);
    expect(gone.status).toBe(404);
  });

  it("returns 404 for someone else's car on show, update and delete", async () => {
    const { auth } = await createUser();
    const other = await createUser();
    const theirCar = await createCar(other.user.id);

    const show = await request(app).get(`/api/cars/${theirCar.id}`).set('Authorization', auth);
    const update = await request(app)
      .patch(`/api/cars/${theirCar.id}`)
      .set('Authorization', auth)
      .send({ color: 'Red' });
    const destroy = await request(app).delete(`/api/cars/${theirCar.id}`).set('Authorization', auth);

    expect([show.status, update.status, destroy.status]).toEqual([404, 404, 404]);
  });

  it('returns 422 for a non-numeric car id', async () => {
    const { auth } = await createUser();

    const res = await request(app).get('/api/cars/abc').set('Authorization', auth);

    expect(res.status).toBe(422);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
npm test -- src/modules/cars
```

Expected: FAIL. Most tests get 404 `Route not found` where they expect 201, 200 or 401 (the router isn't mounted yet).

- [ ] **Step 3: Schemas and service**

`src/modules/cars/cars.schemas.ts`:

```ts
import { z } from 'zod';
import { id, isoDate } from '../../lib/schemas.ts';

export const carParams = z.object({ carId: id });

// Unknown keys (e.g. "userId") are stripped by z.object, which is what $fillable does in Laravel.
export const createCarBody = z.object({
  make: z.string().trim().min(1).max(50),
  model: z.string().trim().min(1).max(50),
  color: z.string().trim().min(1).max(30).nullish(),
  currentKm: z.number().int().min(0).optional(),
  tankSize: z.number().positive().max(9999.99).nullish(),
  purchasedAt: isoDate.nullish(),
});

// No .default() anywhere above: in Zod 4 defaults still apply inside .partial(),
// which would silently reset fields on every PATCH.
export const updateCarBody = createCarBody.partial();

export type CarParams = z.infer<typeof carParams>;
export type CreateCarInput = z.infer<typeof createCarBody>;
export type UpdateCarInput = z.infer<typeof updateCarBody>;
```

`src/modules/cars/cars.service.ts`:

```ts
import { NotFoundError } from '../../lib/errors.ts';
import { paginated, toSkipTake, type Pagination } from '../../lib/pagination.ts';
import { prisma } from '../../lib/prisma.ts';
import type { CreateCarInput, UpdateCarInput } from './cars.schemas.ts';

// The ownership check used by every /cars/:carId route. Someone else's car is a 404,
// not a 403, so the API never confirms that it exists.
export async function findOwnedCar(userId: number, carId: number) {
  const car = await prisma.car.findFirst({ where: { id: carId, userId } });
  if (!car) throw new NotFoundError('Car not found');
  return car;
}

export async function listCars(userId: number, page: Pagination) {
  const where = { userId };
  const [cars, total] = await prisma.$transaction([
    prisma.car.findMany({ where, orderBy: { id: 'asc' }, ...toSkipTake(page) }),
    prisma.car.count({ where }),
  ]);
  return paginated(cars, total, page);
}

export function createCar(userId: number, input: CreateCarInput) {
  return prisma.car.create({ data: { ...input, userId } });
}

export async function updateCar(userId: number, carId: number, input: UpdateCarInput) {
  await findOwnedCar(userId, carId);
  return prisma.car.update({ where: { id: carId }, data: input });
}

export async function deleteCar(userId: number, carId: number) {
  await findOwnedCar(userId, carId);
  await prisma.car.delete({ where: { id: carId } });
}
```

- [ ] **Step 4: Controller, routes, and mounting**

`src/modules/cars/cars.controller.ts`:

```ts
import type { Request, Response } from 'express';
import type { Pagination } from '../../lib/pagination.ts';
import { currentUser } from '../../middleware/authenticate.ts';
import type { CarParams, CreateCarInput, UpdateCarInput } from './cars.schemas.ts';
import * as carsService from './cars.service.ts';

export async function index(req: Request, res: Response) {
  res.json(await carsService.listCars(currentUser(req).id, req.validated.query as Pagination));
}

export async function store(req: Request, res: Response) {
  const car = await carsService.createCar(currentUser(req).id, req.validated.body as CreateCarInput);
  res.status(201).json({ data: car });
}

export async function show(req: Request, res: Response) {
  const { carId } = req.validated.params as CarParams;
  res.json({ data: await carsService.findOwnedCar(currentUser(req).id, carId) });
}

export async function update(req: Request, res: Response) {
  const { carId } = req.validated.params as CarParams;
  const car = await carsService.updateCar(currentUser(req).id, carId, req.validated.body as UpdateCarInput);
  res.json({ data: car });
}

export async function destroy(req: Request, res: Response) {
  const { carId } = req.validated.params as CarParams;
  await carsService.deleteCar(currentUser(req).id, carId);
  res.status(204).end();
}
```

`src/modules/cars/cars.routes.ts`:

```ts
import { Router } from 'express';
import { paginationQuery } from '../../lib/pagination.ts';
import { validate } from '../../middleware/validate.ts';
import * as controller from './cars.controller.ts';
import { carParams, createCarBody, updateCarBody } from './cars.schemas.ts';

export const carsRouter = Router();

carsRouter.get('/', validate({ query: paginationQuery }), controller.index);
carsRouter.post('/', validate({ body: createCarBody }), controller.store);
carsRouter.get('/:carId', validate({ params: carParams }), controller.show);
carsRouter.patch('/:carId', validate({ params: carParams, body: updateCarBody }), controller.update);
carsRouter.delete('/:carId', validate({ params: carParams }), controller.destroy);
```

Replace `src/app.ts`:

`src/app.ts`:

```ts
import express, { Router } from 'express';
import { NotFoundError } from './lib/errors.ts';
import { authenticate } from './middleware/authenticate.ts';
import { errorHandler } from './middleware/error-handler.ts';
import { authRouter } from './modules/auth/auth.routes.ts';
import { carsRouter } from './modules/cars/cars.routes.ts';

export const app = express();

app.use(express.json());

const api = Router();

api.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
api.use('/auth', authRouter);

// Everything below needs a logged-in user, like Route::middleware('auth:sanctum')->group(...).
api.use(authenticate);
api.use('/cars', carsRouter);

app.use('/api', api);

app.use(() => {
  throw new NotFoundError('Route not found');
});
app.use(errorHandler);
```

- [ ] **Step 5: Run the tests and typecheck**

```bash
npm test && npm run typecheck
```

Expected: `Test Files  3 passed (3)`, `Tests  23 passed (23)`; typecheck silent.

- [ ] **Step 6: Commit**

```bash
git add src tests
git commit -m "feat: add cars CRUD scoped to the current user" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Car logs with odometer advancement

**Files:**
- Create: `src/modules/car-logs/car-logs.schemas.ts`, `src/modules/car-logs/car-logs.service.ts`, `src/modules/car-logs/car-logs.controller.ts`, `src/modules/car-logs/car-logs.routes.ts`
- Modify: `src/app.ts` (mount `/cars/:carId/logs`)
- Test: `src/modules/car-logs/car-logs.test.ts`

**Interfaces:**
- Consumes: `findOwnedCar`, `carParams`, `CarParams`, `createUser`, `createCar`, pagination helpers, `Prisma.TransactionClient`.
- Produces: `POST /api/cars/:carId/logs` raises `cars.current_km` to `odometerAtService` when it's higher. Task 8's last test depends on this.

- [ ] **Step 1: Write the failing tests**

`src/modules/car-logs/car-logs.test.ts`:

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCar, createUser } from '../../../tests/helpers.ts';
import { app } from '../../app.ts';
import { prisma } from '../../lib/prisma.ts';

const validLog = {
  title: 'Oil change',
  category: 'maintenance',
  odometerAtService: 51000,
  actualCost: 850.25,
  performedAt: '2026-10-01',
};

async function carKm(carId: number) {
  const car = await prisma.car.findUniqueOrThrow({ where: { id: carId } });
  return car.currentKm;
}

describe('car logs', () => {
  it('creates a log and advances the car odometer when the reading is higher', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id, { currentKm: 50000 });

    const res = await request(app).post(`/api/cars/${car.id}/logs`).set('Authorization', auth).send(validLog);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ carId: car.id, title: 'Oil change', actualCost: '850.25' });
    expect(await carKm(car.id)).toBe(51000);
  });

  it('does not lower the odometer for an older, lower reading', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id, { currentKm: 60000 });

    const res = await request(app)
      .post(`/api/cars/${car.id}/logs`)
      .set('Authorization', auth)
      .send({ ...validLog, odometerAtService: 40000 });

    expect(res.status).toBe(201);
    expect(await carKm(car.id)).toBe(60000);
  });

  it('advances the odometer when a log is updated to a higher reading', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id, { currentKm: 50000 });
    const created = await request(app).post(`/api/cars/${car.id}/logs`).set('Authorization', auth).send(validLog);

    const res = await request(app)
      .patch(`/api/cars/${car.id}/logs/${created.body.data.id}`)
      .set('Authorization', auth)
      .send({ odometerAtService: 55000 });

    expect(res.status).toBe(200);
    expect(await carKm(car.id)).toBe(55000);
  });

  it('keeps the odometer when a log is deleted', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id, { currentKm: 50000 });
    const created = await request(app).post(`/api/cars/${car.id}/logs`).set('Authorization', auth).send(validLog);

    const res = await request(app).delete(`/api/cars/${car.id}/logs/${created.body.data.id}`).set('Authorization', auth);

    expect(res.status).toBe(204);
    expect(await carKm(car.id)).toBe(51000);
  });

  it('lists logs newest first with pagination meta, and shows one', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id);
    await request(app).post(`/api/cars/${car.id}/logs`).set('Authorization', auth).send({ ...validLog, performedAt: '2026-01-01' });
    const newest = await request(app).post(`/api/cars/${car.id}/logs`).set('Authorization', auth).send({ ...validLog, performedAt: '2026-06-01' });

    const list = await request(app).get(`/api/cars/${car.id}/logs`).set('Authorization', auth);
    const one = await request(app).get(`/api/cars/${car.id}/logs/${newest.body.data.id}`).set('Authorization', auth);

    expect(list.status).toBe(200);
    expect(list.body.meta).toEqual({ page: 1, perPage: 15, total: 2 });
    expect(list.body.data[0].id).toBe(newest.body.data.id);
    expect(one.status).toBe(200);
    expect(one.body.data.title).toBe('Oil change');
  });

  it("returns 404 for logs under someone else's car", async () => {
    const { auth } = await createUser();
    const other = await createUser();
    const theirCar = await createCar(other.user.id);

    const list = await request(app).get(`/api/cars/${theirCar.id}/logs`).set('Authorization', auth);
    const create = await request(app).post(`/api/cars/${theirCar.id}/logs`).set('Authorization', auth).send(validLog);

    expect([list.status, create.status]).toEqual([404, 404]);
  });

  it('returns 404 for a log id that belongs to a different car of mine', async () => {
    const { user, auth } = await createUser();
    const carA = await createCar(user.id);
    const carB = await createCar(user.id);
    const log = await request(app).post(`/api/cars/${carA.id}/logs`).set('Authorization', auth).send(validLog);

    const res = await request(app).get(`/api/cars/${carB.id}/logs/${log.body.data.id}`).set('Authorization', auth);

    expect(res.status).toBe(404);
  });

  it('rejects a log without the required fields with 422', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id);

    const res = await request(app).post(`/api/cars/${car.id}/logs`).set('Authorization', auth).send({ notes: 'x' });

    expect(res.status).toBe(422);
    expect(Object.keys(res.body.error.details.fieldErrors).sort()).toEqual([
      'odometerAtService',
      'performedAt',
      'title',
    ]);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
npm test -- src/modules/car-logs
```

Expected: FAIL, with 404 `Route not found` instead of 201 and similar.

- [ ] **Step 3: Schemas and service**

`src/modules/car-logs/car-logs.schemas.ts`:

```ts
import { z } from 'zod';
import { id, isoDate } from '../../lib/schemas.ts';
import { carParams } from '../cars/cars.schemas.ts';

export const logParams = carParams.extend({ logId: id });

export const createLogBody = z.object({
  title: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(50).nullish(),
  odometerAtService: z.number().int().min(0),
  actualCost: z.number().min(0).max(99999999.99).nullish(),
  performedAt: isoDate,
  notes: z.string().max(5000).nullish(),
});

export const updateLogBody = createLogBody.partial();

export type LogParams = z.infer<typeof logParams>;
export type CreateLogInput = z.infer<typeof createLogBody>;
export type UpdateLogInput = z.infer<typeof updateLogBody>;
```

`src/modules/car-logs/car-logs.service.ts`:

```ts
import type { Prisma } from '../../generated/prisma/client.ts';
import { NotFoundError } from '../../lib/errors.ts';
import { paginated, toSkipTake, type Pagination } from '../../lib/pagination.ts';
import { prisma } from '../../lib/prisma.ts';
import { findOwnedCar } from '../cars/cars.service.ts';
import type { CreateLogInput, UpdateLogInput } from './car-logs.schemas.ts';

// Raise the car's odometer to `km`, never lower it. The condition lives in the WHERE
// clause, so two logs saved at once can't overwrite each other with a smaller value.
async function advanceOdometer(tx: Prisma.TransactionClient, carId: number, km: number) {
  await tx.car.updateMany({ where: { id: carId, currentKm: { lt: km } }, data: { currentKm: km } });
}

export async function findLog(userId: number, carId: number, logId: number) {
  await findOwnedCar(userId, carId);
  const log = await prisma.carLog.findFirst({ where: { id: logId, carId } });
  if (!log) throw new NotFoundError('Log not found');
  return log;
}

export async function listLogs(userId: number, carId: number, page: Pagination) {
  await findOwnedCar(userId, carId);
  const where = { carId };
  const [logs, total] = await prisma.$transaction([
    prisma.carLog.findMany({
      where,
      orderBy: [{ performedAt: 'desc' }, { id: 'desc' }],
      ...toSkipTake(page),
    }),
    prisma.carLog.count({ where }),
  ]);
  return paginated(logs, total, page);
}

export async function createLog(userId: number, carId: number, input: CreateLogInput) {
  await findOwnedCar(userId, carId);
  return prisma.$transaction(async (tx) => {
    const log = await tx.carLog.create({ data: { ...input, carId } });
    await advanceOdometer(tx, carId, input.odometerAtService);
    return log;
  });
}

export async function updateLog(userId: number, carId: number, logId: number, input: UpdateLogInput) {
  await findLog(userId, carId, logId);
  return prisma.$transaction(async (tx) => {
    const log = await tx.carLog.update({ where: { id: logId }, data: input });
    if (input.odometerAtService !== undefined) {
      await advanceOdometer(tx, carId, input.odometerAtService);
    }
    return log;
  });
}

// Deleting a log never lowers the car's odometer.
export async function deleteLog(userId: number, carId: number, logId: number) {
  await findLog(userId, carId, logId);
  await prisma.carLog.delete({ where: { id: logId } });
}
```

- [ ] **Step 4: Controller, routes, and mounting**

`src/modules/car-logs/car-logs.controller.ts`:

```ts
import type { Request, Response } from 'express';
import type { Pagination } from '../../lib/pagination.ts';
import { currentUser } from '../../middleware/authenticate.ts';
import type { CarParams } from '../cars/cars.schemas.ts';
import type { CreateLogInput, LogParams, UpdateLogInput } from './car-logs.schemas.ts';
import * as logsService from './car-logs.service.ts';

export async function index(req: Request, res: Response) {
  const { carId } = req.validated.params as CarParams;
  res.json(await logsService.listLogs(currentUser(req).id, carId, req.validated.query as Pagination));
}

export async function store(req: Request, res: Response) {
  const { carId } = req.validated.params as CarParams;
  const log = await logsService.createLog(currentUser(req).id, carId, req.validated.body as CreateLogInput);
  res.status(201).json({ data: log });
}

export async function show(req: Request, res: Response) {
  const { carId, logId } = req.validated.params as LogParams;
  res.json({ data: await logsService.findLog(currentUser(req).id, carId, logId) });
}

export async function update(req: Request, res: Response) {
  const { carId, logId } = req.validated.params as LogParams;
  const log = await logsService.updateLog(currentUser(req).id, carId, logId, req.validated.body as UpdateLogInput);
  res.json({ data: log });
}

export async function destroy(req: Request, res: Response) {
  const { carId, logId } = req.validated.params as LogParams;
  await logsService.deleteLog(currentUser(req).id, carId, logId);
  res.status(204).end();
}
```

`src/modules/car-logs/car-logs.routes.ts`:

```ts
import { Router } from 'express';
import { paginationQuery } from '../../lib/pagination.ts';
import { validate } from '../../middleware/validate.ts';
import { carParams } from '../cars/cars.schemas.ts';
import * as controller from './car-logs.controller.ts';
import { createLogBody, logParams, updateLogBody } from './car-logs.schemas.ts';

// mergeParams lets this router see :carId from the path it is mounted on.
export const carLogsRouter = Router({ mergeParams: true });

carLogsRouter.get('/', validate({ params: carParams, query: paginationQuery }), controller.index);
carLogsRouter.post('/', validate({ params: carParams, body: createLogBody }), controller.store);
carLogsRouter.get('/:logId', validate({ params: logParams }), controller.show);
carLogsRouter.patch('/:logId', validate({ params: logParams, body: updateLogBody }), controller.update);
carLogsRouter.delete('/:logId', validate({ params: logParams }), controller.destroy);
```

Replace `src/app.ts`:

`src/app.ts`:

```ts
import express, { Router } from 'express';
import { NotFoundError } from './lib/errors.ts';
import { authenticate } from './middleware/authenticate.ts';
import { errorHandler } from './middleware/error-handler.ts';
import { authRouter } from './modules/auth/auth.routes.ts';
import { carLogsRouter } from './modules/car-logs/car-logs.routes.ts';
import { carsRouter } from './modules/cars/cars.routes.ts';

export const app = express();

app.use(express.json());

const api = Router();

api.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
api.use('/auth', authRouter);

// Everything below needs a logged-in user, like Route::middleware('auth:sanctum')->group(...).
api.use(authenticate);
api.use('/cars', carsRouter);
api.use('/cars/:carId/logs', carLogsRouter);

app.use('/api', api);

app.use(() => {
  throw new NotFoundError('Route not found');
});
app.use(errorHandler);
```

- [ ] **Step 5: Run the tests and typecheck**

```bash
npm test && npm run typecheck
```

Expected: `Test Files  4 passed (4)`, `Tests  31 passed (31)`; typecheck silent.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: add car logs that advance the car odometer" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Reminders CRUD

**Files:**
- Create: `src/modules/reminders/reminders.schemas.ts`, `src/modules/reminders/reminders.service.ts`, `src/modules/reminders/reminders.controller.ts`, `src/modules/reminders/reminders.routes.ts`
- Modify: `src/app.ts` (mount `/cars/:carId/reminders`)
- Test: `src/modules/reminders/reminders.test.ts`

**Interfaces:**
- Consumes: `findOwnedCar`, `carParams`, `CarParams`, `ValidationError`, `isoDate`, `id`, pagination helpers, `createUser`, `createCar`.
- Produces: `carRemindersRouter` from `reminders.routes.ts`; reminders stored with `remindOn` / `remindAtKm` / `notifiedAt`, which Task 8 reads with raw SQL.

- [ ] **Step 1: Write the failing tests**

`src/modules/reminders/reminders.test.ts`:

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCar, createUser } from '../../../tests/helpers.ts';
import { app } from '../../app.ts';

describe('reminders CRUD', () => {
  it('creates a date reminder and a km reminder', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id);

    const byDate = await request(app)
      .post(`/api/cars/${car.id}/reminders`)
      .set('Authorization', auth)
      .send({ title: 'Renew licence', remindOn: '2027-01-01' });
    const byKm = await request(app)
      .post(`/api/cars/${car.id}/reminders`)
      .set('Authorization', auth)
      .send({ title: 'Timing belt', remindAtKm: 100000 });

    expect(byDate.status).toBe(201);
    expect(byDate.body.data).toMatchObject({ carId: car.id, remindOn: '2027-01-01T00:00:00.000Z', remindAtKm: null });
    expect(byKm.status).toBe(201);
    expect(byKm.body.data).toMatchObject({ remindOn: null, remindAtKm: 100000 });
  });

  it('rejects a reminder with neither remindOn nor remindAtKm', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id);

    const res = await request(app)
      .post(`/api/cars/${car.id}/reminders`)
      .set('Authorization', auth)
      .send({ title: 'Nothing to trigger on' });

    expect(res.status).toBe(422);
    expect(res.body.error.details.fieldErrors.remindOn).toEqual(['Provide remindOn, remindAtKm, or both']);
  });

  it('rejects a PATCH that would leave neither remindOn nor remindAtKm', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id);
    const created = await request(app)
      .post(`/api/cars/${car.id}/reminders`)
      .set('Authorization', auth)
      .send({ title: 'Timing belt', remindAtKm: 100000 });

    const res = await request(app)
      .patch(`/api/cars/${car.id}/reminders/${created.body.data.id}`)
      .set('Authorization', auth)
      .send({ remindAtKm: null });

    expect(res.status).toBe(422);
  });

  it('lists, shows, updates and deletes', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id);
    const created = await request(app)
      .post(`/api/cars/${car.id}/reminders`)
      .set('Authorization', auth)
      .send({ title: 'Timing belt', remindAtKm: 100000 });
    const url = `/api/cars/${car.id}/reminders/${created.body.data.id}`;

    const list = await request(app).get(`/api/cars/${car.id}/reminders`).set('Authorization', auth);
    expect(list.status).toBe(200);
    expect(list.body.meta.total).toBe(1);

    const shown = await request(app).get(url).set('Authorization', auth);
    expect(shown.body.data.title).toBe('Timing belt');

    const updated = await request(app)
      .patch(url)
      .set('Authorization', auth)
      .send({ remindOn: '2027-05-01', notifiedAt: '2026-10-18T09:00:00Z' });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({
      remindAtKm: 100000,
      remindOn: '2027-05-01T00:00:00.000Z',
      notifiedAt: '2026-10-18T09:00:00.000Z',
    });

    const deleted = await request(app).delete(url).set('Authorization', auth);
    expect(deleted.status).toBe(204);
  });

  it("returns 404 for reminders under someone else's car", async () => {
    const { auth } = await createUser();
    const other = await createUser();
    const theirCar = await createCar(other.user.id);

    const res = await request(app).get(`/api/cars/${theirCar.id}/reminders`).set('Authorization', auth);

    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
npm test -- src/modules/reminders/reminders.test.ts
```

Expected: FAIL, with 404 `Route not found` instead of 201 and similar.

- [ ] **Step 3: Schemas and service**

`src/modules/reminders/reminders.schemas.ts`:

```ts
import { z } from 'zod';
import { id, isoDate } from '../../lib/schemas.ts';
import { carParams } from '../cars/cars.schemas.ts';

export const reminderParams = carParams.extend({ reminderId: id });

const reminderFields = {
  title: z.string().trim().min(1).max(100),
  description: z.string().max(5000).nullish(),
  remindOn: isoDate.nullish(),
  remindAtKm: z.number().int().min(0).nullish(),
};

export const createReminderBody = z
  .object(reminderFields)
  .refine((r) => r.remindOn != null || r.remindAtKm != null, {
    message: 'Provide remindOn, remindAtKm, or both',
    path: ['remindOn'],
  });

export const updateReminderBody = z
  .object({
    ...reminderFields,
    notifiedAt: z.iso.datetime().transform((value) => new Date(value)).nullish(),
  })
  .partial();

export type ReminderParams = z.infer<typeof reminderParams>;
export type CreateReminderInput = z.infer<typeof createReminderBody>;
export type UpdateReminderInput = z.infer<typeof updateReminderBody>;
```

`src/modules/reminders/reminders.service.ts`:

```ts
import { NotFoundError, ValidationError } from '../../lib/errors.ts';
import { paginated, toSkipTake, type Pagination } from '../../lib/pagination.ts';
import { prisma } from '../../lib/prisma.ts';
import { findOwnedCar } from '../cars/cars.service.ts';
import type { CreateReminderInput, UpdateReminderInput } from './reminders.schemas.ts';

export async function findReminder(userId: number, carId: number, reminderId: number) {
  await findOwnedCar(userId, carId);
  const reminder = await prisma.reminder.findFirst({ where: { id: reminderId, carId } });
  if (!reminder) throw new NotFoundError('Reminder not found');
  return reminder;
}

export async function listReminders(userId: number, carId: number, page: Pagination) {
  await findOwnedCar(userId, carId);
  const where = { carId };
  const [reminders, total] = await prisma.$transaction([
    prisma.reminder.findMany({ where, orderBy: { id: 'asc' }, ...toSkipTake(page) }),
    prisma.reminder.count({ where }),
  ]);
  return paginated(reminders, total, page);
}

export async function createReminder(userId: number, carId: number, input: CreateReminderInput) {
  await findOwnedCar(userId, carId);
  return prisma.reminder.create({ data: { ...input, carId } });
}

export async function updateReminder(
  userId: number,
  carId: number,
  reminderId: number,
  input: UpdateReminderInput,
) {
  const existing = await findReminder(userId, carId, reminderId);
  // The create rule (date or km) must still hold after the update is applied.
  const remindOn = input.remindOn === undefined ? existing.remindOn : input.remindOn;
  const remindAtKm = input.remindAtKm === undefined ? existing.remindAtKm : input.remindAtKm;
  if (remindOn == null && remindAtKm == null) {
    throw new ValidationError('Provide remindOn, remindAtKm, or both');
  }
  return prisma.reminder.update({ where: { id: reminderId }, data: input });
}

export async function deleteReminder(userId: number, carId: number, reminderId: number) {
  await findReminder(userId, carId, reminderId);
  await prisma.reminder.delete({ where: { id: reminderId } });
}
```

- [ ] **Step 4: Controller, routes, and mounting**

`src/modules/reminders/reminders.controller.ts`:

```ts
import type { Request, Response } from 'express';
import type { Pagination } from '../../lib/pagination.ts';
import { currentUser } from '../../middleware/authenticate.ts';
import type { CarParams } from '../cars/cars.schemas.ts';
import type { CreateReminderInput, ReminderParams, UpdateReminderInput } from './reminders.schemas.ts';
import * as remindersService from './reminders.service.ts';

export async function index(req: Request, res: Response) {
  const { carId } = req.validated.params as CarParams;
  res.json(await remindersService.listReminders(currentUser(req).id, carId, req.validated.query as Pagination));
}

export async function store(req: Request, res: Response) {
  const { carId } = req.validated.params as CarParams;
  const reminder = await remindersService.createReminder(
    currentUser(req).id,
    carId,
    req.validated.body as CreateReminderInput,
  );
  res.status(201).json({ data: reminder });
}

export async function show(req: Request, res: Response) {
  const { carId, reminderId } = req.validated.params as ReminderParams;
  res.json({ data: await remindersService.findReminder(currentUser(req).id, carId, reminderId) });
}

export async function update(req: Request, res: Response) {
  const { carId, reminderId } = req.validated.params as ReminderParams;
  const reminder = await remindersService.updateReminder(
    currentUser(req).id,
    carId,
    reminderId,
    req.validated.body as UpdateReminderInput,
  );
  res.json({ data: reminder });
}

export async function destroy(req: Request, res: Response) {
  const { carId, reminderId } = req.validated.params as ReminderParams;
  await remindersService.deleteReminder(currentUser(req).id, carId, reminderId);
  res.status(204).end();
}
```

`src/modules/reminders/reminders.routes.ts`:

```ts
import { Router } from 'express';
import { paginationQuery } from '../../lib/pagination.ts';
import { validate } from '../../middleware/validate.ts';
import { carParams } from '../cars/cars.schemas.ts';
import * as controller from './reminders.controller.ts';
import { createReminderBody, reminderParams, updateReminderBody } from './reminders.schemas.ts';

export const carRemindersRouter = Router({ mergeParams: true });

carRemindersRouter.get('/', validate({ params: carParams, query: paginationQuery }), controller.index);
carRemindersRouter.post('/', validate({ params: carParams, body: createReminderBody }), controller.store);
carRemindersRouter.get('/:reminderId', validate({ params: reminderParams }), controller.show);
carRemindersRouter.patch(
  '/:reminderId',
  validate({ params: reminderParams, body: updateReminderBody }),
  controller.update,
);
carRemindersRouter.delete('/:reminderId', validate({ params: reminderParams }), controller.destroy);
```

Replace `src/app.ts`:

`src/app.ts`:

```ts
import express, { Router } from 'express';
import { NotFoundError } from './lib/errors.ts';
import { authenticate } from './middleware/authenticate.ts';
import { errorHandler } from './middleware/error-handler.ts';
import { authRouter } from './modules/auth/auth.routes.ts';
import { carLogsRouter } from './modules/car-logs/car-logs.routes.ts';
import { carsRouter } from './modules/cars/cars.routes.ts';
import { carRemindersRouter } from './modules/reminders/reminders.routes.ts';

export const app = express();

app.use(express.json());

const api = Router();

api.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
api.use('/auth', authRouter);

// Everything below needs a logged-in user, like Route::middleware('auth:sanctum')->group(...).
api.use(authenticate);
api.use('/cars', carsRouter);
api.use('/cars/:carId/logs', carLogsRouter);
api.use('/cars/:carId/reminders', carRemindersRouter);

app.use('/api', api);

app.use(() => {
  throw new NotFoundError('Route not found');
});
app.use(errorHandler);
```

- [ ] **Step 5: Run the tests and typecheck**

```bash
npm test && npm run typecheck
```

Expected: `Test Files  5 passed (5)`, `Tests  36 passed (36)`; typecheck silent.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: add reminders CRUD with a date-or-km trigger rule" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Due reminders (by date or km)

This is the port of the Laravel `whereColumn` query from the old README, and the test coverage that README said was missing.

**Files:**
- Create: `src/modules/reminders/due-reminders.service.ts`, `src/modules/reminders/due-reminders.routes.ts`
- Modify: `src/app.ts` (mount `/reminders`)
- Test: `src/modules/reminders/due-reminders.test.ts`

**Interfaces:**
- Consumes: `prisma`, `currentUser`, `createUser`, `createCar`, and the odometer behaviour from Task 6.
- Produces: `type DueReminder = { id; carId; title; description; remindOn: Date | null; remindAtKm: number | null; currentKm: number; dueBy: 'date' | 'km' | 'both' }` and `listDueReminders(userId: number) → Promise<DueReminder[]>`.

- [ ] **Step 1: Write the failing tests**

`src/modules/reminders/due-reminders.test.ts`:

```ts
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCar, createUser } from '../../../tests/helpers.ts';
import { app } from '../../app.ts';
import { prisma } from '../../lib/prisma.ts';

function reminder(carId: number, data: { remindOn?: string; remindAtKm?: number; notifiedAt?: Date }) {
  return prisma.reminder.create({
    data: {
      carId,
      title: 'Reminder',
      remindOn: data.remindOn ? new Date(data.remindOn) : null,
      remindAtKm: data.remindAtKm ?? null,
      notifiedAt: data.notifiedAt ?? null,
    },
  });
}

// The test database runs in UTC (Docker default), so "today" is the UTC date.
const today = new Date().toISOString().slice(0, 10);

describe('GET /api/reminders/due', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/reminders/due');

    expect(res.status).toBe(401);
  });

  it('includes reminders due by date, by km, and by both', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id, { currentKm: 60000 });
    const byDate = await reminder(car.id, { remindOn: '2020-01-01' });
    const byKm = await reminder(car.id, { remindAtKm: 60000 });
    const byBoth = await reminder(car.id, { remindOn: '2021-01-01', remindAtKm: 50000 });

    const res = await request(app).get('/api/reminders/due').set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.data.map((r: { id: number; dueBy: string }) => [r.id, r.dueBy])).toEqual([
      [byDate.id, 'date'],
      [byBoth.id, 'both'],
      [byKm.id, 'km'],
    ]);
    expect(res.body.data[0]).toMatchObject({ carId: car.id, currentKm: 60000 });
  });

  it('treats a reminder dated today as due', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id);
    await reminder(car.id, { remindOn: today });

    const res = await request(app).get('/api/reminders/due').set('Authorization', auth);

    expect(res.body.data).toHaveLength(1);
  });

  it('excludes future dates, unreached km, and already-notified reminders', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id, { currentKm: 60000 });
    await reminder(car.id, { remindOn: '2099-01-01' });
    await reminder(car.id, { remindAtKm: 60001 });
    await reminder(car.id, { remindOn: '2099-01-01', remindAtKm: 70000 });
    await reminder(car.id, { remindOn: '2020-01-01', notifiedAt: new Date() });

    const res = await request(app).get('/api/reminders/due').set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("excludes other users' due reminders", async () => {
    const { auth } = await createUser();
    const other = await createUser();
    const theirCar = await createCar(other.user.id, { currentKm: 99999 });
    await reminder(theirCar.id, { remindOn: '2020-01-01' });

    const res = await request(app).get('/api/reminders/due').set('Authorization', auth);

    expect(res.body.data).toEqual([]);
  });

  it('becomes due once a log pushes the odometer past the target', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id, { currentKm: 59000 });
    await reminder(car.id, { remindAtKm: 60000 });

    const before = await request(app).get('/api/reminders/due').set('Authorization', auth);
    await request(app)
      .post(`/api/cars/${car.id}/logs`)
      .set('Authorization', auth)
      .send({ title: 'Trip', odometerAtService: 60500, performedAt: today });
    const after = await request(app).get('/api/reminders/due').set('Authorization', auth);

    expect(before.body.data).toEqual([]);
    expect(after.body.data).toHaveLength(1);
    expect(after.body.data[0].dueBy).toBe('km');
  });
});
```

- [ ] **Step 2: Run them to see them fail**

```bash
npm test -- src/modules/reminders/due-reminders.test.ts
```

Expected: FAIL, with 404 `Route not found` instead of 200 (the "requires authentication" test already passes, because the auth gate runs first).

- [ ] **Step 3: Service and route**

`src/modules/reminders/due-reminders.service.ts`:

```ts
import { prisma } from '../../lib/prisma.ts';

export type DueReminder = {
  id: number;
  carId: number;
  title: string;
  description: string | null;
  remindOn: Date | null;
  remindAtKm: number | null;
  currentKm: number;
  dueBy: 'date' | 'km' | 'both';
};

// A reminder is due when its date has arrived OR its car has reached the target km.
// The km half compares two columns (cars.current_km vs reminders.remind_at_km), which
// Prisma's query API can't express across a relation, so this is raw SQL. The ${userId}
// placeholder is sent as a bound parameter, not pasted into the string, so it's injection-safe.
export function listDueReminders(userId: number) {
  return prisma.$queryRaw<DueReminder[]>`
    SELECT r.id,
           r.car_id       AS "carId",
           r.title,
           r.description,
           r.remind_on    AS "remindOn",
           r.remind_at_km AS "remindAtKm",
           c.current_km   AS "currentKm",
           CASE
             WHEN r.remind_on <= CURRENT_DATE AND c.current_km >= r.remind_at_km THEN 'both'
             WHEN r.remind_on <= CURRENT_DATE THEN 'date'
             ELSE 'km'
           END AS "dueBy"
    FROM reminders r
    JOIN cars c ON c.id = r.car_id
    WHERE c.user_id = ${userId}
      AND r.notified_at IS NULL
      AND (r.remind_on <= CURRENT_DATE OR c.current_km >= r.remind_at_km)
    ORDER BY r.remind_on ASC NULLS LAST, r.id ASC
  `;
}
```

`src/modules/reminders/due-reminders.routes.ts`:

```ts
import { Router, type Request, type Response } from 'express';
import { currentUser } from '../../middleware/authenticate.ts';
import { listDueReminders } from './due-reminders.service.ts';

export const dueRemindersRouter = Router();

dueRemindersRouter.get('/due', async (req: Request, res: Response) => {
  res.json({ data: await listDueReminders(currentUser(req).id) });
});
```

Replace `src/app.ts` with the final version:

`src/app.ts`:

```ts
import express, { Router } from 'express';
import { NotFoundError } from './lib/errors.ts';
import { authenticate } from './middleware/authenticate.ts';
import { errorHandler } from './middleware/error-handler.ts';
import { authRouter } from './modules/auth/auth.routes.ts';
import { carLogsRouter } from './modules/car-logs/car-logs.routes.ts';
import { carsRouter } from './modules/cars/cars.routes.ts';
import { dueRemindersRouter } from './modules/reminders/due-reminders.routes.ts';
import { carRemindersRouter } from './modules/reminders/reminders.routes.ts';

export const app = express();

app.use(express.json());

const api = Router();

api.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
api.use('/auth', authRouter);

// Everything below needs a logged-in user, like Route::middleware('auth:sanctum')->group(...).
api.use(authenticate);
api.use('/cars', carsRouter);
api.use('/cars/:carId/logs', carLogsRouter);
api.use('/cars/:carId/reminders', carRemindersRouter);
api.use('/reminders', dueRemindersRouter);

app.use('/api', api);

app.use(() => {
  throw new NotFoundError('Route not found');
});
app.use(errorHandler);
```

- [ ] **Step 4: Run the tests and typecheck**

```bash
npm test && npm run typecheck
```

Expected: `Test Files  6 passed (6)`, `Tests  42 passed (42)`; typecheck silent.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: add due reminders endpoint (by date or by km)" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: README and full verification

**Files:**
- Modify: `README.md` (replace the one-line README)

**Interfaces:** none.

- [ ] **Step 1: Write the README**

`README.md`:

````markdown
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
````

- [ ] **Step 2: Verify everything from a clean build**

```bash
rm -rf dist
npm run typecheck
npm test
npm run build
ls dist/server.js
```

Expected: typecheck silent; `Tests  42 passed (42)`; build silent; `dist/server.js` exists.

- [ ] **Step 3: Smoke-test the compiled server**

```bash
PORT=3999 node --env-file=.env dist/server.js &
SERVER_PID=$!
sleep 3
curl -s localhost:3999/api/health
curl -s -X POST localhost:3999/api/auth/register -H 'content-type: application/json' \
  -d '{"name":"Smoke","email":"smoke@example.com","password":"password123"}'
kill $SERVER_PID
```

Expected: `{"status":"ok"}`, then a `{"data":{"user":{...},"token":"..."}}` body. This writes one row to the **dev** database, which is fine.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup, API overview and Laravel-to-Node mapping" -m "Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 5: Hand off**

Don't push or merge here. Use superpowers:finishing-a-development-branch, which asks the developer how to integrate `stage-1-core` (merge into `main` and push, or open a PR).
