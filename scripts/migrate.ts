import { createDatabase } from "../src/lib/db/connection";
import { loadConfig } from "../src/lib/config";

/**
 * Apply the schema to the configured database file. Safe to run repeatedly —
 * the schema uses CREATE TABLE IF NOT EXISTS.
 */
function main(): void {
  // JWT_SECRET is required by loadConfig(); provide a throwaway for migrate only.
  process.env.JWT_SECRET ??= "migrate-only";
  const config = loadConfig();
  const db = createDatabase(config.databasePath);
  db.close();
  console.log(`Migrated database at ${config.databasePath}`);
}

main();
