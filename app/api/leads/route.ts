// MOCK — POST /api/leads → { ok: true }
// Real backend (Role 1) also emails (Titan SMTP) + appends to Google Sheets.
import { NextResponse } from "next/server";
import { leads, nextLeadId } from "@/lib/mock-data";
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
  const contact = (body.contact ?? "").trim();
  if (!name || !contact) {
    return NextResponse.json(
      { error: "name and contact are required" },
      { status: 422 },
    );
  }

  leads.unshift({
    id: nextLeadId(),
    car_id: body.car_id ?? null,
    name,
    contact,
    message: (body.message ?? "").trim(),
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
