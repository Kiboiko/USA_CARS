import { HttpError } from "./http";
import { extractBearerToken, verifyAdminToken, type AdminTokenClaims } from "./services/tokens";
import { getConfig } from "./config";

/**
 * Resolve the authenticated admin from a request's Authorization header, or
 * throw HttpError(401). Used by every /api/admin/* route handler as a second
 * line of defence in addition to the edge middleware.
 */
export async function requireAdmin(req: Request): Promise<AdminTokenClaims> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) throw new HttpError(401, "Missing bearer token");
  const claims = await verifyAdminToken(token, getConfig().jwtSecret);
  if (!claims) throw new HttpError(401, "Invalid or expired token");
  return claims;
}
