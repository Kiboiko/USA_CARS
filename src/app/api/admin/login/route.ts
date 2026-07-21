import { getDb } from "@/lib/db/connection";
import { getConfig } from "@/lib/config";
import { getAdminByUsername } from "@/lib/db/adminUsers";
import { verifyPassword, signAdminToken } from "@/lib/services/auth";
import { loginSchema, formatZodError } from "@/lib/validation";
import { json, jsonError, parseJsonBody, withErrorHandling } from "@/lib/http";

export const dynamic = "force-dynamic";

// POST /api/admin/login  body: { username, password } → { token }
export const POST = withErrorHandling(async (req: Request): Promise<Response> => {
  const body = await parseJsonBody(req);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(formatZodError(parsed.error), 400);
  }

  const config = getConfig();
  const user = getAdminByUsername(getDb(), parsed.data.username);
  // Verify against the stored hash even when the user is missing? We short-circuit
  // but return the same generic message either way to avoid username enumeration.
  const ok = user ? await verifyPassword(parsed.data.password, user.password_hash) : false;
  if (!user || !ok) {
    return jsonError("Invalid credentials", 401);
  }

  const token = await signAdminToken(
    { id: user.id, username: user.username },
    config.jwtSecret,
    config.jwtExpiresIn,
  );
  return json({ token });
});
