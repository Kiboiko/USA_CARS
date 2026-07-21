// MOCK — GET /api/admin/leads → [{ id, car_id, name, contact, message, created_at }]
import { NextResponse } from "next/server";
import { requireAuth } from "@/app/api/_mock";
import { leads } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const unauth = requireAuth(req);
  if (unauth) return unauth;
  return NextResponse.json(leads);
}
