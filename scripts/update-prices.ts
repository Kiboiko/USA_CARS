import { existsSync, readFileSync } from "node:fs";
import { loadDotEnv } from "./_env";
import { createDatabase } from "../src/lib/db/connection";
import { loadConfig } from "../src/lib/config";
import { getCar } from "../src/lib/db/cars";

/**
 * Apply a price list to the catalog. Input is a JSON array produced from the
 * client's price spreadsheet:
 *
 *   [{ "id": 12, "title": "1969 Oldsmobile 442", "price": 32000 }, ...]
 *
 * `title` is a guard, not a lookup key: the row is skipped unless it still
 * matches "<year> <make> <model>" of the car with that id, so a stale file can
 * never overwrite the wrong car's price. Only `price` (and `updated_at`) is
 * touched — photos, description and leads are left alone.
 *
 * Usage:  npx tsx scripts/update-prices.ts [data/price-update.json] [--dry]
 */

const path = process.argv.find((a) => a.endsWith(".json")) ?? "data/price-update.json";
const dryRun = process.argv.includes("--dry");

interface PriceRow {
  id: number;
  title: string;
  price: number;
}

/** Titles come from a spreadsheet — normalise the characters that vary. */
function norm(s: string): string {
  return s.replace(/×/g, "x").replace(/[–—]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();
}

function main(): void {
  loadDotEnv();
  process.env.JWT_SECRET ??= "import-only";
  const config = loadConfig();

  if (!existsSync(path)) throw new Error(`Price file not found: ${path}`);
  const rows = JSON.parse(readFileSync(path, "utf8")) as PriceRow[];

  const db = createDatabase(config.databasePath);
  const update = db.prepare("UPDATE cars SET price = ?, updated_at = datetime('now') WHERE id = ?");

  let changed = 0;
  let unchanged = 0;
  const problems: string[] = [];

  for (const row of rows) {
    const car = getCar(db, row.id);
    if (!car) {
      problems.push(`id=${row.id} (${row.title}) — no such car`);
      continue;
    }
    const actual = `${car.year} ${car.make} ${car.model}`;
    if (norm(actual) !== norm(row.title)) {
      problems.push(`id=${row.id} — expected "${row.title}", found "${actual}" — skipped`);
      continue;
    }
    if (car.price === row.price) {
      unchanged += 1;
      continue;
    }
    if (!dryRun) update.run(row.price, row.id);
    changed += 1;
    const delta = row.price - car.price;
    console.log(
      `  id=${String(row.id).padEnd(3)} ${actual.padEnd(45)} $${car.price.toLocaleString("en-US")} -> $${row.price.toLocaleString("en-US")} (${delta > 0 ? "+" : ""}${delta.toLocaleString("en-US")})`,
    );
  }

  db.close();
  console.log(`\n${dryRun ? "[dry run] " : ""}Updated ${changed}, already correct ${unchanged}, of ${rows.length} rows.`);
  if (problems.length > 0) {
    console.log("Problems:");
    for (const p of problems) console.log(`  ! ${p}`);
    process.exitCode = 1;
  }
}

main();
