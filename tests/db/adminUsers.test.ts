import { describe, it, expect, beforeEach } from "vitest";
import type { Db } from "@/lib/db/connection";
import { getAdminByUsername, upsertAdmin, countAdmins } from "@/lib/db/adminUsers";
import { makeDb } from "../helpers";

describe("adminUsers repository", () => {
  let db: Db;
  beforeEach(() => {
    db = makeDb();
  });

  it("inserts a new admin", () => {
    const user = upsertAdmin(db, "admin1", "hash1");
    expect(user.id).toBeGreaterThan(0);
    expect(user.username).toBe("admin1");
    expect(getAdminByUsername(db, "admin1")!.password_hash).toBe("hash1");
    expect(countAdmins(db)).toBe(1);
  });

  it("updates the password hash on conflict without duplicating", () => {
    upsertAdmin(db, "admin1", "hash1");
    upsertAdmin(db, "admin1", "hash2");
    expect(countAdmins(db)).toBe(1);
    expect(getAdminByUsername(db, "admin1")!.password_hash).toBe("hash2");
  });

  it("returns null for unknown username", () => {
    expect(getAdminByUsername(db, "nope")).toBeNull();
  });
});
