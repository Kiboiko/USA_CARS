import { existsSync, readFileSync } from "node:fs";
import { loadDotEnv } from "./_env";
import { createDatabase } from "../src/lib/db/connection";
import { loadConfig } from "../src/lib/config";
import { createCar, listCarsDetail } from "../src/lib/db/cars";
import type { ManifestCar } from "./import-new-cars";

/**
 * Server-side half of the catalog import: inserts the cars described by a
 * manifest produced by `import-new-cars.ts`. The photos it references are
 * uploaded separately (public/uploads/new/**), so this script needs no image
 * tooling and never touches existing cars or leads.
 *
 * Usage:  npx tsx scripts/apply-cars-manifest.ts [path/to/manifest.json]
 */

const manifestPath = process.argv[2] ?? "data/new-cars-manifest.json";

function main(): void {
  loadDotEnv();
  process.env.JWT_SECRET ??= "import-only";
  const config = loadConfig();

  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as ManifestCar[];

  const db = createDatabase(config.databasePath);
  const key = (c: { year: number; make: string; model: string }) =>
    `${c.year}|${c.make.toLowerCase()}|${c.model.toLowerCase()}`;
  const existing = new Set(listCarsDetail(db).map(key));

  let inserted = 0;
  let skipped = 0;

  for (const car of manifest) {
    const label = `${car.year} ${car.make} ${car.model}`;
    if (existing.has(key(car))) {
      console.log(`  = ${label} — already in the catalog`);
      skipped += 1;
      continue;
    }
    createCar(db, {
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price,
      mileage: car.mileage,
      description: car.description,
      photos: car.photos,
    });
    existing.add(key(car));
    inserted += 1;
    console.log(`  + ${label} — ${car.photos.length} photos`);
  }

  const total = listCarsDetail(db).length;
  db.close();
  console.log(`\nInserted ${inserted}, skipped ${skipped}. Catalog now has ${total} cars.`);
}

main();
