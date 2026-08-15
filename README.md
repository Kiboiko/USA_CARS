# USA Cars — full-stack site

Used-car sales site for the US market (ТЗ `TZ_sayt_avto_2_roli.md`). Single
**Next.js 15 (App Router) + React 19 + TypeScript** app containing both roles:

- **Role 1 — backend / API / integrations:** DB (`node:sqlite`), the `/api/*`
  contract (§6), lead pipeline (DB → email → Google Sheets), admin auth + CRUD.
- **Role 2 — frontend / UI:** public site (car list, car page, lead form, static
  pages, SEO) and the admin panel, all talking to the real API on the same origin.

The two branches (`Backend`, `Frontend`) were merged here; the frontend's mock API
routes were dropped in favour of Role 1's real backend, and everything lives under
`src/`.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, server components + client lead form / admin |
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
cp .env.example .env      # fill in JWT_SECRET, admin passwords, SMTP, Sheets
npm run db:migrate        # create the SQLite file + schema
npm run db:seed           # create admin logins (from env) + sample cars
npm run dev               # http://localhost:3000
```

Because the API is same-origin, leave `NEXT_PUBLIC_API_BASE_URL` empty. Set it only
if the frontend is ever deployed separately from the backend.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve |
| `npm run lint` | next lint |
| `npm run db:migrate` | Apply schema to `DATABASE_PATH` |
| `npm run db:seed` | Seed admin users (env) + sample cars (only if empty) |
| `npm test` / `test:coverage` | Vitest suite (+ coverage) |
| `npm run typecheck` | `tsc --noEmit` |

## Pages (Role 2)

- `/` — car list (grid), server-rendered from `GET /api/cars`
- `/cars/[id]` — gallery + specs + lead form (`GET /api/cars/:id`, `POST /api/leads`)
- `/contacts`, `/privacy`, `/team` — static pages
- `/admin/login`, `/admin/cars` (CRUD + upload), `/admin/leads`
- SEO: per-page metadata + OpenGraph, `sitemap.xml`, `robots.txt`

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
- `phone`, `email` — both optional individually, but **at least one is required**. `email` is format-validated when present.
  The site's own form is stricter than the API: its submit button stays disabled
  until name, phone *and* email are all filled in and valid.
- `interest` — optional; one of the slugs below (empty = placeholder not chosen). Fetch from `GET /api/lead-options`:

  | value (API) | label (UI) |
  |---|---|
  | `buy_now` | Buy Now |
  | `trade_in` | Trade-In |
  | `finance` | Finance This Vehicle |
  | `lease` | Lease This Vehicle |
  | `test_drive` | Schedule a Test Drive |
  | `availability` | Ask About Availability |

- `message` — optional.

`POST /api/leads` runs the flow from ТЗ §2.2: **save to DB → email (Titan) → Google
Sheets append**. Email/Sheets are best-effort — if unconfigured or failing, the lead
is still saved and the endpoint still returns `201`.

### Admin (require `Authorization: Bearer <token>`)

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/admin/login` | `{ username, password }` | `{ token }` |
| GET | `/api/admin/cars` | — | list |
| POST | `/api/admin/cars` | `{ make, model, year, price, mileage?, description?, photos? }` | `201 car` |
| GET/PUT/DELETE | `/api/admin/cars/:id` | PUT: same as POST | `car` / `{ ok: true }` |
| POST | `/api/admin/upload` | multipart `file` | `201 { url }` |
| GET | `/api/admin/leads` | — | `[{ id, car_id, name, phone, email, interest, message, created_at }]` |

`/api/admin/*` is guarded by edge middleware ([src/middleware.ts](src/middleware.ts))
plus `requireAdmin()` in each handler. `/api/admin/login` is public.

## Layout

```
src/
  app/
    (site)/            public pages (header/footer chrome): home, cars/[id], contacts, privacy, team
    admin/             admin panel (own chrome + client auth gate)
    api/**/route.ts    real backend route handlers (Role 1)
    layout.tsx         root layout + site metadata
    robots.ts, sitemap.ts, globals.css
  middleware.ts        edge guard for /api/admin/*
  components/          Header, Footer, CarCard, Gallery, LeadForm, admin/CarFormModal
  lib/
    api.ts, server-api.ts   frontend fetch layer (client + server components)
    types.ts, format.ts, site.ts, admin-auth.ts
    config.ts, validation.ts, http.ts, adminGuard.ts
    db/                schema, connection (node:sqlite), repos, bootstrap
    services/          auth, tokens, email, sheets, upload, leadService
scripts/               migrate.ts, seed.ts (run via tsx)
tests/                 Vitest — backend layers, 125+ tests
```

## Notes

- **Contract coupling:** field names in [src/lib/types.ts](src/lib/types.ts) (frontend)
  mirror [src/lib/validation.ts](src/lib/validation.ts) (backend). Change one → change both.
- **Testability by injection:** side-effects (SMTP transport, `fetch` for Sheets,
  filesystem for uploads) are injected, so tests never hit the network/disk.
- **`node:sqlite` via `createRequire`** in [connection.ts](src/lib/db/connection.ts) —
  bundlers don't yet recognise it as a built-in.
