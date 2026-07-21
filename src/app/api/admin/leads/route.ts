import { getDb } from "@/lib/db/connection";
import { listLeads } from "@/lib/db/leads";
import { requireAdmin } from "@/lib/adminGuard";
import { json, withErrorHandling } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/admin/leads → [{ id, car_id, name, contact, message, created_at }]
export const GET = withErrorHandling(async (req: Request): Promise<Response> => {
  await requireAdmin(req);
  return json(listLeads(getDb()));
});
