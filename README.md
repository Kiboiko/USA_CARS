# USA Auto Sales — Frontend (Role 2)

Frontend/UI for the USA used-car sales site, per `TZ_sayt_avto_2_roli.md` **Role 2**.
Built with **Next.js 14 (App Router) + React + TypeScript**.

The app runs standalone against **built-in mock API routes** that implement the
§6 API contract, so the UI works end-to-end before Role 1's backend exists.
Switching to the real backend is a single env change — no page edits.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional; defaults work out of the box
npm run dev                  # http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

## What's included (per TZ)

**Public site (§1, §2.1):**
- `/` — car list (grid of cards), server-rendered from `GET /api/cars`
- `/cars/[id]` — car page: photo gallery, specs, description, lead form (`GET /api/cars/:id`)
- `/contacts`, `/privacy`, `/team` — static pages
- Lead form with client-side validation → `POST /api/leads`
  (name + phone + email + interest + message; Interest options from
  `GET /api/lead-options`, "Select Your Interest" placeholder sends `""`)
- Responsive / mobile layout
- SEO: per-page metadata + OpenGraph, `sitemap.xml`, `robots.txt`

**Admin panel (§2.3):**
- `/admin/login` — login → `POST /api/admin/login` (demo: `admin` / `admin`)
- `/admin/cars` — list + add / edit / delete + photo upload (`/api/admin/cars`, `/api/admin/upload`)
- `/admin/leads` — submitted leads table (`GET /api/admin/leads`)

## Switching from mocks to the real backend (Role 1)

1. Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` to the backend origin.
2. All calls go through `lib/api.ts` / `lib/server-api.ts`, so nothing else changes
   as long as the §6 contract holds.
3. The mock routes under `app/api/**` and `lib/mock-data.ts` become unused and can
   be deleted.

## Project layout

```
app/
  (site)/            public pages (header/footer chrome)
    page.tsx           car list (home)
    cars/[id]/         car detail
    contacts|privacy|team/
  admin/             admin panel (its own chrome + auth gate)
  api/               MOCK endpoints implementing the §6 contract
  sitemap.ts, robots.ts
components/          Header, Footer, CarCard, Gallery, LeadForm, admin/CarFormModal
lib/                types, api client, server-api, mock-data, format, auth, site
```

## Contract dependency

Field names in `lib/types.ts` mirror TZ §6 exactly. Any change to the contract
must be agreed with Role 1 (backend) first — it is the single coupling point
between the two roles.
