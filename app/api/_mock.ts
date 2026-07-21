// Shared helpers for the mock API routes. These routes are Role 2 stand-ins
// so the frontend runs standalone (TZ §5). Role 1 replaces them with the real
// backend; the frontend then points at NEXT_PUBLIC_API_BASE_URL instead.

import { NextResponse } from "next/server";

export const MOCK_TOKEN = "mock-admin-token";

/** Very small bearer check for the mock admin routes. */
export function requireAuth(req: Request): NextResponse | null {
  const header = req.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (token !== MOCK_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
