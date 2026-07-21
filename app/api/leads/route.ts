// MOCK — POST /api/leads → { ok: true }
// Real backend (Role 1) also emails (Titan SMTP) + appends to Google Sheets.
import { NextResponse } from "next/server";
import { INTEREST_VALUES, leads, nextLeadId } from "@/lib/mock-data";
import type { LeadInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Partial<LeadInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const email = (body.email ?? "").trim();
  const interest = (body.interest ?? "").trim();

  // At least one contact method is required.
  if (!name || (!phone && !email)) {
    return NextResponse.json(
      { error: "name and at least one of phone/email are required" },
      { status: 422 },
    );
  }

  // Interest must be a known slug or empty ("" = not selected). Mirrors
  // Role 1: an unknown value → 400.
  if (interest !== "" && !INTEREST_VALUES.has(interest)) {
    return NextResponse.json({ error: "invalid interest" }, { status: 400 });
  }

  leads.unshift({
    id: nextLeadId(),
    car_id: body.car_id ?? null,
    name,
    phone,
    email,
    interest,
    message: (body.message ?? "").trim(),
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
