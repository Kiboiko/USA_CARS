import bcrypt from "bcryptjs";

/**
 * Password hashing (bcrypt). Token helpers live in ./tokens (jose only) and are
 * re-exported here so existing imports of "@/lib/services/auth" keep working,
 * while edge code (middleware) can import ./tokens directly without bcrypt.
 */

const BCRYPT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export {
  signAdminToken,
  verifyAdminToken,
  extractBearerToken,
  type AdminTokenClaims,
} from "./tokens";
