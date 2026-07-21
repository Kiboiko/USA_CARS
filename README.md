# USA Cars — Backend (Role 1)

Backend / API / integrations for the car-sales site (ТЗ `TZ_sayt_avto_2_roli.md`, **Роль 1**).
Next.js (App Router) + TypeScript. Persistence uses Node's built-in `node:sqlite`
(no native npm dependency). Fully covered by Vitest.

> Role 2 (frontend/UI) is intentionally **not** implemented here — only the placeholder
> root page exists so the app builds. Role 1 provides the API under `/api/*`.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router route handlers) |
| DB | `node:sqlite` (built into Node ≥ 22.5 / 24) |
| Validation | zod |
| Auth | bcryptjs (password hash) + jose (JWT, HS256) |
| Email | nodemailer (Titan SMTP) |
| Google Sheets | service-account JWT (RS256) → REST `values.append`, via `jose` + `fetch` |
| Tests | Vitest (+ v8 coverage) |

Requires **Node ≥ 22.5** (uses `node:sqlite`). Developed on Node 24.

## Setup

```bash
npm install
cp .env.example .env     # fill in JWT_SECRET, admin passwords, SMTP, Sheets
npm run db:migrate       # create the SQLite file + schema
npm run db:seed          # create admin logins (from env) + sample cars
npm run dev              # http://localhost:3000
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve |
| `npm run db:migrate` | Apply schema to `DATABASE_PATH` |
| `npm run db:seed` | Seed admin users (env) + sample cars (only if empty) |
| `npm test` | Run the Vitest suite |
| `npm run test:coverage` | Suite + coverage report |
| `npm run typecheck` | `tsc --noEmit` |

## API (contract — ТЗ §6)

### Public

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/cars` | — | `[{ id, make, model, year, price, mileage, photo_cover }]` |
| GET | `/api/cars/:id` | — | `{ id, make, model, year, price, mileage, description, photos }` |
| POST | `/api/leads` | `{ car_id?, name, phone?, email?, interest?, message? }` | `201 { ok: true }` |
| GET | `/api/lead-options` | — | `{ interests: [{ value, label }] }` |
| GET | `/api/health` | — | `{ ok: true, ts }` |

**Lead form fields** (client-provided example — NAME / PHONE / EMAIL / SELECT YOUR INTEREST / MESSAGE):

- `name` — **required**.
- `phone`, `email` — both optional individually, but **at least one is required** (a way to reply). `email` is format-validated when present.
- `interest` — optional; one of the slugs below (empty = placeholder "Select Your Interest" not chosen). Fetch the list from `GET /api/lead-options`:

  | value (API) | label (UI) |
  |---|---|
  | `buy_now` | Buy Now |
  | `trade_in` | Trade-In |
  | `finance` | Finance This Vehicle |
  | `lease` | Lease This Vehicle |
  | `test_drive` | Schedule a Test Drive |
  | `availability` | Ask About Availability |

- `message` — optional.

`POST /api/leads` runs the flow from ТЗ §2.2: **save to DB → email (Titan) → Google Sheets append**.
Email/Sheets are best-effort — if either is unconfigured or fails, the lead is still
saved and the endpoint still returns `201`.

### Admin (require `Authorization: Bearer <token>`)

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/admin/login` | `{ username, password }` | `{ token }` |
| GET | `/api/admin/cars` | — | list |
| POST | `/api/admin/cars` | `{ make, model, year, price, mileage?, description?, photos? }` | `201 car` |
| GET | `/api/admin/cars/:id` | — | `car` |
| PUT | `/api/admin/cars/:id` | same as POST | `car` |
| DELETE | `/api/admin/cars/:id` | — | `{ ok: true }` |
| POST | `/api/admin/upload` | multipart `file` | `201 { url }` |
| GET | `/api/admin/leads` | — | `[{ id, car_id, name, phone, email, interest, message, created_at }]` |

`/api/admin/*` is guarded twice: edge middleware ([src/middleware.ts](src/middleware.ts))
plus `requireAdmin()` inside each handler. `/api/admin/login` is public.

## Environment

See [.env.example](.env.example). Key points:

- **`JWT_SECRET`** — required; used to sign admin tokens.
- **Email** (`SMTP_*`, `LEADS_EMAIL_TO`) — Titan host/port from the mailbox's
  *Webmail → Settings → Configure 3rd party apps* (ТЗ §4). If incomplete, email is skipped.
- **Google Sheets** (`GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`) —
  share the sheet with the service-account email. Private key is only ever read on the
  backend. If incomplete, Sheets append is skipped.

## Layout

```
src/
  app/api/**/route.ts   # thin route handlers (contract §6)
  middleware.ts         # edge guard for /api/admin/*
  lib/
    config.ts           # env parsing (single source of env access)
    validation.ts       # zod request schemas
    http.ts             # json()/error helpers + withErrorHandling
    adminGuard.ts       # requireAdmin()
    db/                  # schema, connection (node:sqlite), repos, bootstrap
    services/           # auth, email, sheets, upload, leadService (orchestration)
scripts/                # migrate.ts, seed.ts (run via tsx)
tests/                  # Vitest — mirrors src/, 100+ tests
```

## Design notes

- **Testability by injection.** Side-effects (SMTP transport, `fetch` for Sheets,
  filesystem for uploads) are passed in, so tests use fakes and never hit the network/disk.
- **Repositories take a `Db` argument** rather than a global, so every DB test runs against
  a fresh in-memory database.
- **`node:sqlite` is loaded via `createRequire`** in [connection.ts](src/lib/db/connection.ts)
  because bundlers don't yet recognise it as a built-in.
