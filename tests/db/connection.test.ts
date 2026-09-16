import { describe, it, expect, afterEach } from "vitest";
import { rmSync, existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabase, getDb, resetDb } from "@/lib/db/connection";
import { resetConfigCache } from "@/lib/config";

afterEach(() => {
  resetDb();
  resetConfigCache();
});

describe("db connection", () => {
  it("creates the parent directory and a file-backed database", () => {
    const dir = mkdtempSync(join(tmpdir(), "usacars-db-"));
    const path = join(dir, "nested", "app.db");
    const db = createDatabase(path);
    db.exec("INSERT INTO cars (make, model, year, price) VALUES ('A','B',2020,1)");
    db.close();
    expect(existsSync(path)).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });

  it("returns a singleton from getDb() and rebuilds it after resetDb()", () => {
    process.env.DATABASE_PATH = ":memory:";
    resetConfigCache();
    // Same instance across calls: a row inserted via one call is visible via the next.
    getDb().exec("INSERT INTO cars (make, model, year, price) VALUES ('A','B',2020,1)");
    const count = (db: ReturnType<typeof getDb>) =>
      (db.prepare("SELECT COUNT(*) AS n FROM cars").get() as { n: number }).n;
    expect(count(getDb())).toBe(1);
    // After reset, getDb() rebuilds a fresh (empty) database.
    resetDb();
    expect(count(getDb())).toBe(0);
  });

  it("resetDb() is safe to call when no db exists", () => {
    resetDb();
    expect(() => resetDb()).not.toThrow();
  });

  it("adds the sold column to a database file created before it existed", () => {
    const dir = mkdtempSync(join(tmpdir(), "usacars-migrate-"));
    const path = join(dir, "legacy.db");

    // Simulate a database from before the "sold" column was introduced.
    const legacy = createDatabase(path);
    legacy.exec("ALTER TABLE cars DROP COLUMN sold");
    legacy.exec("INSERT INTO cars (make, model, year, price) VALUES ('A','B',2020,1)");
    legacy.close();

    // Reopening it — what happens on the next server start — should add the
    // column back (defaulting existing rows to not sold) without touching data.
    const reopened = createDatabase(path);
    const row = reopened.prepare("SELECT make, sold FROM cars").get() as {
      make: string;
      sold: number;
    };
    expect(row).toEqual({ make: "A", sold: 0 });
    reopened.close();
    rmSync(dir, { recursive: true, force: true });
  });
});
