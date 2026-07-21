// MOCK — GET /api/lead-options → { interests: [{ value, label }] }
// Array lives under `interests`; the "Select Your Interest" placeholder is
// added by the frontend, not returned here.
import { NextResponse } from "next/server";
import { INTEREST_OPTIONS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ interests: INTEREST_OPTIONS });
}
