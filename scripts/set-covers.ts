import { existsSync, readFileSync } from "node:fs";
import { loadDotEnv } from "./_env";
import { createDatabase } from "../src/lib/db/connection";
import { loadConfig } from "../src/lib/config";
import { getCar } from "../src/lib/db/cars";

/**
 * Set which photo is a car's cover. The catalog uses the first entry of the
 * `photos` array as the card thumbnail, so this moves the chosen photo to the
 * front and leaves the rest of the gallery in its existing order.
 *
 * Input — JSON produced from a visual review of the galleries:
 *
 *   [{ "id": 12, "title": "1969 Oldsmobile 442", "cover": "/uploads/…/10.webp" }]
 *
 * The cover is addressed by URL rather than position, so re-running is a no-op
 * once applied. `title` guards against a stale file hitting the wrong car.
 *
 * Usage:  npx tsx scripts/set-covers.ts [data/covers.json] [--dry]
 */

const path = process.argv.find((a) => a.endsWith(".json")) ?? "data/covers.json";
const dryRun = process.argv.includes("--dry");

interface CoverRow {
  id: number;
  title: string;
  cover: string;
}

function norm(s: string): string {
  return s.replace(/×/g, "x").replace(/\s+/g, " ").trim().toLowerCase();
}

function main(): void {
  loadDotEnv();
  process.env.JWT_SECRET ??= "import-only";
  const config = loadConfig();

  if (!existsSync(path)) throw new Error(`Cover file not found: ${path}`);
  const rows = JSON.parse(readFileSync(path, "utf8")) as CoverRow[];

  const db = createDatabase(config.databasePath);
  const update = db.prepare("UPDATE cars SET photos = ?, updated_at = datetime('now') WHERE id = ?");

  let changed = 0;
  let already = 0;
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
    const index = car.photos.indexOf(row.cover);
    if (index === -1) {
      problems.push(`id=${row.id} (${actual}) — photo not in gallery: ${row.cover}`);
      continue;
    }
    if (index === 0) {
      already += 1;
      continue;
    }

    const reordered = [row.cover, ...car.photos.filter((p) => p !== row.cover)];
    if (!dryRun) update.run(JSON.stringify(reordered), row.id);
    changed += 1;
    console.log(`  id=${String(row.id).padEnd(3)} ${actual.padEnd(45)} cover: photo #${index + 1} -> #1`);
  }

  db.close();
  console.log(`\n${dryRun ? "[dry run] " : ""}Reordered ${changed}, already correct ${already}, of ${rows.length} cars.`);
  if (problems.length > 0) {
    console.log("Problems:");
    for (const p of problems) console.log(`  ! ${p}`);
    process.exitCode = 1;
  }
}

main();
