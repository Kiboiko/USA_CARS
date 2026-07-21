import { SignJWT, jwtVerify, type JWTPayload } from "jose";

/**
 * Stateless admin session tokens (JWT via jose). Kept separate from auth.ts
 * (bcrypt) so the Next.js edge middleware can import token verification without
 * pulling bcrypt — which relies on Node APIs — into the edge bundle.
 */

export interface AdminTokenClaims extends JWTPayload {
  sub: string; // admin user id (as string)
  username: string;
}

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/** Sign a signed JWT for an authenticated admin. */
export async function signAdminToken(
  claims: { id: number; username: string },
  secret: string,
  expiresIn: string,
): Promise<string> {
  return new SignJWT({ username: claims.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(claims.id))
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey(secret));
}

/**
 * Verify a JWT. Returns the claims on success, or null if the token is missing,
 * malformed, expired, or signed with a different secret.
 */
export async function verifyAdminToken(
  token: string,
  secret: string,
): Promise<AdminTokenClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(secret), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.username !== "string") {
      return null;
    }
    return payload as AdminTokenClaims;
  } catch {
    return null;
  }
}

/** Extract a bearer token from an Authorization header value. */
export function extractBearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}
