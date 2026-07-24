import { readFileSync, readdirSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { createDatabase } from "../src/lib/db/connection";
import { loadConfig } from "../src/lib/config";
import { createCar } from "../src/lib/db/cars";

/**
 * One-off import of the client-provided feed (folder ./3feed) into the catalog.
 * For each car it copies the photos into public/uploads/feed/<slug>/ and inserts
 * a row with the description from that folder's text file.
 *
 * NOTE: the client did not provide price/mileage — the values below are
 * placeholders (market-ballpark) and should be corrected in the admin panel.
 */

const SRC_DIR = "3feed";
const DEST_REL = "feed"; // under public/uploads
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

interface FeedCar {
  folder: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  price: number; // PLACEHOLDER
  mileage: number; // PLACEHOLDER
}

// Prices and mileage confirmed by the client.
const CARS: FeedCar[] = [
  { folder: "2018 BMW M3 Competition", slug: "bmw-m3-competition", year: 2018, make: "BMW", model: "M3 Competition", price: 39900, mileage: 51122 },
  { folder: "2018 BMW M550i xDrive", slug: "bmw-m550i-xdrive", year: 2018, make: "BMW", model: "M550i xDrive", price: 24900, mileage: 125236 },
  { folder: "2018 Dodge Challenger SRT Demon", slug: "dodge-challenger-srt-demon", year: 2018, make: "Dodge", model: "Challenger SRT Demon", price: 84900, mileage: 2679 },
  { folder: "2018 Jeep Grand Cherokee Trackhawk", slug: "jeep-grand-cherokee-trackhawk", year: 2018, make: "Jeep", model: "Grand Cherokee Trackhawk", price: 54900, mileage: 34027 },
  { folder: "2018 Mercedes-Benz GLE63 AMG S", slug: "mercedes-gle63-amg-s", year: 2018, make: "Mercedes-Benz", model: "GLE63 AMG S", price: 29900, mileage: 34153 },
  { folder: "2019 BMW 8 Series M850i xDrive", slug: "bmw-8-series-m850i-xdrive", year: 2019, make: "BMW", model: "8 Series M850i xDrive", price: 36900, mileage: 94741 },
];

function readDescription(folderPath: string): string {
  const txt = readdirSync(folderPath).find((f) => f.toLowerCase().endsWith(".txt"));
  if (!txt) return "";
  return readFileSync(join(folderPath, txt), "utf8").trim();
}

function imageFiles(folderPath: string): string[] {
  return readdirSync(folderPath)
    .filter((f) => IMAGE_EXT.has(extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function main(): void {
  process.env.JWT_SECRET ??= "import-only";
  const config = loadConfig();

  if (!existsSync(SRC_DIR)) {
    throw new Error(`Source folder "${SRC_DIR}" not found (run from repo root).`);
  }

  const db = createDatabase(config.databasePath);

  // Replace any existing catalog (demo/placeholder cars) with the real feed.
  db.exec("DELETE FROM cars");
  db.exec("DELETE FROM sqlite_sequence WHERE name = 'cars'");

  let total = 0;
  for (const car of CARS) {
    const folderPath = join(SRC_DIR, car.folder);
    if (!existsSync(folderPath)) {
      console.warn(`  skip: folder not found — ${car.folder}`);
      continue;
    }

    const destDir = join(config.uploadDir, DEST_REL, car.slug);
    mkdirSync(destDir, { recursive: true });

    const photos: string[] = [];
    imageFiles(folderPath).forEach((file, i) => {
      const ext = extname(file).toLowerCase();
      const name = `${String(i + 1).padStart(2, "0")}${ext}`;
      copyFileSync(join(folderPath, file), join(destDir, name));
      // Public URL (files under public/ are served from the site root).
      photos.push(`${config.publicUploadPath.replace(/\/$/, "")}/${DEST_REL}/${car.slug}/${name}`);
    });

    createCar(db, {
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price,
      mileage: car.mileage,
      description: readDescription(folderPath),
      photos,
    });
    console.log(`  + ${car.year} ${car.make} ${car.model} — ${photos.length} photos`);
    total += 1;
  }

  db.close();
  console.log(`\nImported ${total} cars into ${config.databasePath}.`);
}

main();
