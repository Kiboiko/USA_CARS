import { getDb } from "@/lib/db/connection";
import { getConfig } from "@/lib/config";
import { submitLead } from "@/lib/services/leadService";
import { leadSchema, formatZodError } from "@/lib/validation";
import { json, jsonError, parseJsonBody, withErrorHandling } from "@/lib/http";

export const dynamic = "force-dynamic";

// POST /api/leads  body: { car_id, name, contact, message } → { ok: true }
export const POST = withErrorHandling(async (req: Request): Promise<Response> => {
  const body = await parseJsonBody(req);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(formatZodError(parsed.error), 400);
  }

  await submitLead(getDb(), getConfig(), parsed.data);
  return json({ ok: true }, { status: 201 });
});
