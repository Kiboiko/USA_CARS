// Server-side data fetching for Server Components. Server fetch needs an
// absolute URL: NEXT_PUBLIC_API_BASE_URL when Role 1's backend is configured,
// otherwise this app's own API.

import type { CarDetail, CarListItem } from "./types";

/**
 * The API is served by this same process, so it is called on the loopback
 * address rather than by the site's public name. Going out through the domain
 * made every page depend on the server resolving its own name — when that
 * lookup failed, pages still loaded but showed no cars — and cost an nginx +
 * TLS round trip on every render.
 */
async function serverBase(): Promise<string> {
  const ext = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (ext) return ext.replace(/\/$/, "");
  return `http://127.0.0.1:${process.env.PORT ?? 3000}`;
}

export async function getCarsServer(): Promise<CarListItem[]> {
  const res = await fetch(`${await serverBase()}/api/cars`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET /api/cars failed: ${res.status}`);
  return res.json();
}

export async function getCarServer(id: string): Promise<CarDetail | null> {
  const res = await fetch(`${await serverBase()}/api/cars/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET /api/cars/${id} failed: ${res.status}`);
  return res.json();
}
