// In-memory mock store used by the built-in mock API routes (/app/api/**).
// This exists so Role 2 (frontend) can build and demo end-to-end before
// Role 1's backend is ready. When the real backend lands, set
// NEXT_PUBLIC_API_BASE_URL and these routes/data become unused.
//
// NOTE: an in-memory store resets on server restart and is per-process —
// fine for a mock, not a real DB. Role 1 owns persistence (TZ §3).

import type { CarDetail, Lead, LeadOption } from "./types";

// Interest options for the lead form. Mirrors Role 1's validation.ts
// (source of truth); the real values come from GET /api/lead-options.
// Order is stable. The "Select Your Interest" placeholder (value: "") is
// NOT included here — the frontend adds it and "" is a valid submission.
export const INTEREST_OPTIONS: LeadOption[] = [
  { value: "buy_now", label: "Buy Now" },
  { value: "trade_in", label: "Trade-In" },
  { value: "finance", label: "Finance This Vehicle" },
  { value: "lease", label: "Lease This Vehicle" },
  { value: "test_drive", label: "Schedule a Test Drive" },
  { value: "availability", label: "Ask About Availability" },
];

/** Valid interest slugs (empty string also accepted = not selected). */
export const INTEREST_VALUES = new Set(INTEREST_OPTIONS.map((o) => o.value));

function photo(seed: string, w = 1200, h = 800): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const MAKES: Array<[string, string, number, number, number]> = [
  // make, model, year, price(USD), mileage(mi)
  ["Toyota", "Camry SE", 2021, 24990, 31200],
  ["Honda", "Accord Sport", 2020, 23450, 42800],
  ["Ford", "Mustang GT", 2019, 33900, 28900],
  ["Chevrolet", "Tahoe LT", 2022, 51900, 19400],
  ["Tesla", "Model 3", 2021, 34990, 22100],
  ["BMW", "330i xDrive", 2020, 29900, 37600],
  ["Jeep", "Wrangler Sahara", 2021, 39900, 25300],
  ["Nissan", "Altima SV", 2019, 18990, 51200],
  ["Hyundai", "Sonata Limited", 2022, 27400, 14800],
  ["Kia", "Telluride SX", 2022, 42900, 16700],
  ["Dodge", "Charger R/T", 2020, 31900, 33400],
  ["Subaru", "Outback Premium", 2021, 28900, 27800],
  ["Mazda", "CX-5 Touring", 2021, 26900, 24100],
  ["Volkswagen", "Tiguan SE", 2020, 22900, 39900],
  ["Lexus", "RX 350", 2020, 41900, 30200],
  ["Audi", "Q5 Premium", 2021, 38900, 21600],
  ["GMC", "Sierra 1500", 2021, 45900, 26400],
  ["Ram", "1500 Big Horn", 2020, 39900, 34700],
  ["Mercedes-Benz", "C 300", 2020, 34900, 29800],
  ["Acura", "MDX Tech", 2021, 43900, 18900],
];

function buildCars(): CarDetail[] {
  return MAKES.map(([make, model, year, price, mileage], i) => {
    const id = i + 1;
    const seed = `${make}-${model}`.replace(/\s+/g, "");
    return {
      id,
      make,
      model,
      year,
      price,
      mileage,
      description:
        `${year} ${make} ${model}. Clean title, one owner, no accidents. ` +
        `Well maintained with full service history. Features power windows, ` +
        `backup camera, Apple CarPlay/Android Auto, dual-zone climate control ` +
        `and cruise control. Recently inspected and ready to drive.`,
      photos: [
        photo(`${seed}-1`),
        photo(`${seed}-2`),
        photo(`${seed}-3`),
        photo(`${seed}-4`),
      ],
    };
  });
}

// Mutable singletons so admin CRUD mock mutations persist within a process.
// Use globalThis to survive Next.js dev hot-reload module re-evaluation.
const g = globalThis as unknown as {
  __mockCars?: CarDetail[];
  __mockLeads?: Lead[];
  __mockLeadSeq?: number;
};

export const cars: CarDetail[] = (g.__mockCars ??= buildCars());
export const leads: Lead[] = (g.__mockLeads ??= []);

export function nextCarId(): number {
  return cars.reduce((max, c) => Math.max(max, c.id), 0) + 1;
}

export function nextLeadId(): number {
  g.__mockLeadSeq = (g.__mockLeadSeq ?? 0) + 1;
  return g.__mockLeadSeq;
}
