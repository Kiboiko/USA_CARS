// Server-side data fetching for Server Components. Server fetch needs an
// absolute URL, so we resolve one from the incoming request host (or from
// NEXT_PUBLIC_API_BASE_URL when Role 1's backend is configured).

import { headers } from "next/headers";
import type { CarDetail, CarListItem } from "./types";

function serverBase(): string {
  const ext = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (ext) return ext.replace(/\/$/, "");
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function getCarsServer(): Promise<CarListItem[]> {
  const res = await fetch(`${serverBase()}/api/cars`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET /api/cars failed: ${res.status}`);
  return res.json();
}

export async function getCarServer(id: string): Promise<CarDetail | null> {
  const res = await fetch(`${serverBase()}/api/cars/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET /api/cars/${id} failed: ${res.status}`);
  return res.json();
}
