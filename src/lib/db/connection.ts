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

/** Create a fresh database instance and apply the schema. */
export function createDatabase(path: string): Db {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSyncCtor(path);
  db.exec(SCHEMA_SQL);
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
