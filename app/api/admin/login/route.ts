// MOCK — POST /api/admin/login → { token }
// Demo credentials: admin / admin. Role 1 replaces with real auth (§6).
import { NextResponse } from "next/server";
import { MOCK_TOKEN } from "@/app/api/_mock";
import type { LoginInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: Partial<LoginInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (body.username === "admin" && body.password === "admin") {
    return NextResponse.json({ token: MOCK_TOKEN });
  }
  return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
}
