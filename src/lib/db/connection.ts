import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { SCHEMA_SQL } from "./schema";
import { getConfig } from "../config";

/**
 * Load the built-in SQLite module via createRequire rather than a static ESM
 * import. `node:sqlite` is a newer built-in that some bundlers (Vite/Vitest)
 * don't yet recognise and try to resolve as an npm package; a runtime require
 * keeps it opaque to static analysis while `import type` preserves the types.
 */
const nodeRequire = createRequire(import.meta.url);
const { DatabaseSync: DatabaseSyncCtor } = nodeRequire("node:sqlite") as typeof import("node:sqlite");

/**
 * Thin re-export of the built-in SQLite type so the rest of the codebase does
 * not import `node:sqlite` directly (keeps the dependency in one place and makes
 * the repositories easy to mock/type).
 */
export type Db = DatabaseSync;

/**
 * Add columns introduced after a database was first created. `SCHEMA_SQL`
 * uses `CREATE TABLE IF NOT EXISTS`, so it never touches a table that already
 * exists — a column added there only reaches fresh databases (new deploys,
 * tests) unless it is also applied here for the one already on disk.
 */
function runMigrations(db: Db): void {
  const columns = db.prepare("PRAGMA table_info(cars)").all() as Array<{ name: string }>;
  const hasSold = columns.some((c) => c.name === "sold");
  if (!hasSold) {
    db.exec("ALTER TABLE cars ADD COLUMN sold INTEGER NOT NULL DEFAULT 0");
  }
}

/** Create a fresh database instance and apply the schema. */
export function createDatabase(path: string): Db {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSyncCtor(path);
  db.exec(SCHEMA_SQL);
  runMigrations(db);
  return db;
}

let singleton: Db | null = null;

/** Process-wide database used by API route handlers. */
export function getDb(): Db {
  if (!singleton) {
    singleton = createDatabase(getConfig().databasePath);
  }
  return singleton;
}

/** Test helper: close and drop the singleton so the next getDb() rebuilds it. */
export function resetDb(): void {
  if (singleton) {
    try {
      singleton.close();
    } catch {
      /* already closed */
    }
    singleton = null;
  }
}
