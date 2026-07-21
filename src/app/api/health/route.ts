import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/health → { ok: true } — cheap liveness probe for deploy monitoring.
export function GET(): Response {
  return json({ ok: true, ts: new Date().toISOString() });
}
