import type { Db } from "./connection";

export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

/** Look up an admin user by username, or null. */
export function getAdminByUsername(db: Db, username: string): AdminUser | null {
  const row = db
    .prepare("SELECT * FROM admin_users WHERE username = ?")
    .get(username) as AdminUser | undefined;
  return row ?? null;
}

/**
 * Create an admin user, or update the password hash if the username already
 * exists. Used by the seed script for the two agreed logins (ТЗ §2).
 */
export function upsertAdmin(db: Db, username: string, passwordHash: string): AdminUser {
  db.prepare(
    `INSERT INTO admin_users (username, password_hash)
     VALUES (?, ?)
     ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash`,
  ).run(username, passwordHash);
  const user = getAdminByUsername(db, username);
  if (!user) throw new Error("Failed to load admin after upsert");
  return user;
}

export function countAdmins(db: Db): number {
  const row = db.prepare("SELECT COUNT(*) AS n FROM admin_users").get() as { n: number };
  return row.n;
}
