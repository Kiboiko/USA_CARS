import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { extname, join } from "node:path";
import { loadDotEnv } from "./_env";
import { createDatabase } from "../src/lib/db/connection";
import { loadConfig } from "../src/lib/config";
import { createCar, listCarsDetail } from "../src/lib/db/cars";

/**
 * Import of the client's second batch (archive `new_cars.rar`, folder `iss/`).
 *
 * Additive — existing cars are kept; a car already in the catalog (same
 * year/make/model) is skipped, so the script is safe to re-run.
 *
 * For each car it:
 *   1. reads the two client text files — one holds the price, the other the
 *      marketing copy + a "FULL SPECIFICATIONS" key/value block;
 *   2. copies the photos into public/uploads/new/<slug>/, re-encoding the
 *      oversized ones (the client mixed 3–4 MB PNGs with small WebPs) to WebP;
 *   3. inserts the car and writes data/new-cars-manifest.json, which
 *      `apply-cars-manifest.ts` replays on the server.
 *
 * Usage:  npm run import:new-cars [-- --include-review] [--dry]
 *   SRC_DIR   source folder (default: new_cars/iss)
 */

const SRC_DIR = process.env.SRC_DIR ?? join("new_cars", "iss");
const DEST_REL = "new"; // under public/uploads
const MANIFEST_PATH = join("data", "new-cars-manifest.json");
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
/** Anything above this is re-encoded to WebP — the site serves photos as-is. */
const REENCODE_OVER_BYTES = 900 * 1024;
const MAX_WIDTH = 1920;

interface SourceCar {
  folder: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  /** Set when the client's spec block disagrees with the folder/description. */
  mileage?: number;
  /**
   * Filename fragment of the photo to use as the cover (card thumbnail).
   * Set where the client's filenames give the heuristic below nothing to go on
   * and it would otherwise lead with an interior or undercarriage shot.
   */
  cover?: string;
  /** Client copy is unusable (pasted from another car) — needs a real one. */
  review?: string;
}

/**
 * Year/make/model come from the folder name and the description text, not from
 * the "FULL SPECIFICATIONS" block: the client's block has the wrong year for
 * several cars (e.g. the 1970 Bronco is listed as 1972). Price and mileage come
 * from the text files.
 */
const CARS: SourceCar[] = [
  { folder: "1965 CHEVROLET C20", slug: "chevrolet-c20-1965", year: 1965, make: "Chevrolet", model: "C20" },
  { folder: "1967 BUICK RIVIERA", slug: "buick-riviera-1967", year: 1967, make: "Buick", model: "Riviera" },
  { folder: "1968 FORD MUSTANG", slug: "ford-mustang-1968", year: 1968, make: "Ford", model: "Mustang" },
  { folder: "1969 CHEVROLET CAMARO", slug: "chevrolet-camaro-1969", year: 1969, make: "Chevrolet", model: "Camaro", cover: "camaro-4.webp" },
  { folder: "1969 CHEVROLET CHEVELLE", slug: "chevrolet-chevelle-1969", year: 1969, make: "Chevrolet", model: "Chevelle" },
  { folder: "1969 OLDSMOBILE 442", slug: "oldsmobile-442-1969", year: 1969, make: "Oldsmobile", model: "442" },
  { folder: "1969 PONTIAC FIREBIRD", slug: "pontiac-firebird-1969", year: 1969, make: "Pontiac", model: "Firebird", cover: "firebird (15)" },
  { folder: "1970 FORD BRONCO", slug: "ford-bronco-1970", year: 1970, make: "Ford", model: "Bronco" },
  { folder: "1970 PLYMOUTH ROAD RUNNER", slug: "plymouth-road-runner-1970", year: 1970, make: "Plymouth", model: "Road Runner" },
  { folder: "1971 CHEVROLET CHEVELLE SS", slug: "chevrolet-chevelle-ss-1971", year: 1971, make: "Chevrolet", model: "Chevelle SS" },
  { folder: "1971 PONTIAC FIREBIRD TRANS AM", slug: "pontiac-firebird-trans-am-1971", year: 1971, make: "Pontiac", model: "Firebird Trans Am", cover: "trans-am (2)" },
  { folder: "1972 CHEVROLET CAMARO", slug: "chevrolet-camaro-1972", year: 1972, make: "Chevrolet", model: "Camaro" },
  { folder: "1976 CHEVROLET CAMARO", slug: "chevrolet-camaro-type-lt-1976", year: 1976, make: "Chevrolet", model: "Camaro Type LT" },
  {
    folder: "1979 CHEVROLET C10",
    slug: "chevrolet-c10-1979",
    year: 1979,
    make: "Chevrolet",
    model: "C10",
    mileage: 0,
    review: "client text file holds the 1976 Camaro copy — description and mileage unknown",
  },
  {
    folder: "1980 CHEVROLET CORVETTE",
    slug: "chevrolet-corvette-1980",
    year: 1980,
    make: "Chevrolet",
    model: "Corvette",
    mileage: 0,
    review: "client text file holds the 1976 Camaro copy — description and mileage unknown",
  },
  { folder: "2019 BMW M2", slug: "bmw-m2-competition-2019", year: 2019, make: "BMW", model: "M2 Competition", cover: "2625261" },
  { folder: "2021 BMW X5 M COMPETITION", slug: "bmw-x5-m-competition-2021", year: 2021, make: "BMW", model: "X5 M Competition", cover: "96898-96899" },
  { folder: "2021 JEEP WK2 GRAND CHEROKEE", slug: "jeep-grand-cherokee-trackhawk-2021", year: 2021, make: "Jeep", model: "Grand Cherokee Trackhawk" },
  { folder: "2021 TOYOTA TUNDRA (XK50 2007-2021)", slug: "toyota-tundra-trd-pro-2021", year: 2021, make: "Toyota", model: "Tundra TRD Pro" },
  { folder: "2022 BMW M3 6-Speed", slug: "bmw-m3-6-speed-2022", year: 2022, make: "BMW", model: "M3 6-Speed", cover: "29128-29129" },
  { folder: "2022 DODGE RAM TRX", slug: "ram-1500-trx-6x6-2022", year: 2022, make: "Dodge", model: "Ram 1500 TRX 6×6", cover: "9282737" },
  { folder: "2022 LAND ROVER DEFENDER L663", slug: "land-rover-defender-110-s-2022", year: 2022, make: "Land Rover", model: "Defender 110 S Trek Edition", cover: "img_1469" },
  { folder: "2023 AUDI RS5", slug: "audi-rs5-sportback-2023", year: 2023, make: "Audi", model: "RS5 Sportback", cover: "20240303_180923" },
  { folder: "2023 PORSCHE MACAN GTS", slug: "porsche-macan-gts-2023", year: 2023, make: "Porsche", model: "Macan GTS" },
  { folder: "Individual Wildberry Metallic 2023 BMW M4 Competition Coupe", slug: "bmw-m4-competition-coupe-2023", year: 2023, make: "BMW", model: "M4 Competition Coupe", cover: "31961-31962" },
];

export interface ManifestCar {
  slug: string;
  year: number;
  make: string;
  model: string;
  price: number;
  mileage: number;
  description: string;
  photos: string[];
  /** Kept for reference only — the car page shows "VIN: available on request". */
  vin?: string;
  review?: string;
}

// ---------------------------------------------------------------- text files

interface SourceText {
  price: number | null;
  body: string;
}

function readSourceText(folderPath: string): SourceText {
  let price: number | null = null;
  let body = "";

  for (const file of readdirSync(folderPath).filter((f) => f.toLowerCase().endsWith(".txt"))) {
    const raw = readFileSync(join(folderPath, file), "utf8").replace(/^﻿/, "").trim();
    const asPrice = raw.match(/^\$\s*([\d,]+)$/);
    if (asPrice) {
      price = Number(asPrice[1].replace(/,/g, ""));
    } else if (raw.length > body.length) {
      body = raw; // the long file is the copy + spec block
    }
  }
  return { price, body };
}

/** Marketing copy: everything between "DESCRIPTION" and the spec block. */
function extractDescription(body: string): string {
  const text = body.replace(/\r\n/g, "\n");
  const start = text.search(/^\s*DESCRIPTION\s*$/m);
  let out = start === -1 ? text : text.slice(start).replace(/^\s*DESCRIPTION\s*\n/, "");
  const end = out.search(/^\s*(Technical Data|FULL SPECIFICATIONS|AT A GLANCE)\s*$/m);
  if (end !== -1) out = out.slice(0, end);
  return out.trim().replace(/\n{3,}/g, "\n\n");
}

/**
 * Values in the client files sit on the line after their label. The last
 * occurrence wins — the modern cars repeat the labels in an "AT A GLANCE"
 * teaser before the authoritative "FULL SPECIFICATIONS" block.
 */
function spec(body: string, label: string): string | null {
  const lines = body.replace(/\r\n/g, "\n").split("\n").map((l) => l.trim());
  for (let i = lines.length - 2; i >= 0; i -= 1) {
    if (lines[i].toLowerCase() === label.toLowerCase() && lines[i + 1]) return lines[i + 1];
  }
  return null;
}

function titleCaseSpec(value: string): string {
  if (/^v\d+$/i.test(value)) return value.toUpperCase(); // v8 -> V8
  if (/^[a-z]/.test(value)) return value[0].toUpperCase() + value.slice(1); // automatic -> Automatic
  return value;
}

/** Engine/transmission have no columns in the schema — append them as a line. */
function withSpecLine(description: string, body: string): string {
  const parts: string[] = [];
  const engine = spec(body, "Engine");
  const transmission = spec(body, "Transmission");
  if (engine) parts.push(`Engine: ${titleCaseSpec(engine)}`);
  if (transmission) parts.push(`Transmission: ${titleCaseSpec(transmission)}`);
  if (parts.length === 0) return description;
  return `${description}\n\n${parts.join(" · ")}`.trim();
}

// ------------------------------------------------------------------- photos

const COVER_HINTS: Array<[RegExp, number]> = [
  [/front/i, 4],
  [/exterior|overall/i, 3],
  [/rear|side|profile/i, 1],
  [/interior|console|cargo|dash|seat|detail|engine|wheel|under/i, -3],
];

function coverScore(name: string): number {
  return COVER_HINTS.reduce((score, [re, w]) => (re.test(name) ? score + w : score), 0);
}

/** Natural sort, then promote the chosen (or most likely) exterior shot to the cover slot. */
function orderedImages(folderPath: string, cover?: string): string[] {
  const files = readdirSync(folderPath)
    .filter((f) => IMAGE_EXT.has(extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  let best = 0;
  if (cover) {
    const picked = files.findIndex((f) => f.toLowerCase().includes(cover.toLowerCase()));
    if (picked === -1) console.warn(`  ! cover "${cover}" not found in ${folderPath}`);
    else best = picked;
  } else {
    for (let i = 1; i < files.length; i += 1) {
      if (coverScore(files[i]) > coverScore(files[best])) best = i;
    }
  }
  return best === 0 ? files : [files[best], ...files.filter((_, i) => i !== best)];
}

type Resize = (src: string, dest: string) => Promise<void>;

/** sharp ships with Next.js; fall back to a plain copy if it isn't installed. */
async function loadResizer(): Promise<Resize | null> {
  try {
    const sharp = (await import("sharp")).default;
    return async (src, dest) => {
      await sharp(src)
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(dest);
    };
  } catch {
    return null;
  }
}

async function copyPhotos(
  folderPath: string,
  destDir: string,
  publicBase: string,
  resize: Resize | null,
  cover?: string,
): Promise<string[]> {
  mkdirSync(destDir, { recursive: true });
  const photos: string[] = [];

  const files = orderedImages(folderPath, cover);
  for (let i = 0; i < files.length; i += 1) {
    const src = join(folderPath, files[i]);
    const ext = extname(files[i]).toLowerCase();
    const heavy = ext === ".png" || statSync(src).size > REENCODE_OVER_BYTES;
    const index = String(i + 1).padStart(2, "0");

    if (heavy && resize) {
      const name = `${index}.webp`;
      await resize(src, join(destDir, name));
      photos.push(`${publicBase}/${name}`);
    } else {
      const name = `${index}${ext}`;
      copyFileSync(src, join(destDir, name));
      photos.push(`${publicBase}/${name}`);
    }
  }
  return photos;
}

// --------------------------------------------------------------------- main

async function main(): Promise<void> {
  loadDotEnv();
  process.env.JWT_SECRET ??= "import-only";
  const config = loadConfig();

  const includeReview = process.argv.includes("--include-review");
  const dryRun = process.argv.includes("--dry");

  if (!existsSync(SRC_DIR)) {
    throw new Error(`Source folder "${SRC_DIR}" not found (run from the repo root, or set SRC_DIR).`);
  }

  const db = createDatabase(config.databasePath);
  const existing = new Set(
    listCarsDetail(db).map((c) => `${c.year}|${c.make.toLowerCase()}|${c.model.toLowerCase()}`),
  );

  const resize = await loadResizer();
  if (!resize) console.warn("! sharp unavailable — photos are copied without re-encoding\n");

  const manifest: ManifestCar[] = [];
  let imported = 0;
  let skipped = 0;

  for (const car of CARS) {
    const label = `${car.year} ${car.make} ${car.model}`;

    if (car.review && !includeReview) {
      console.log(`  ~ ${label} — held back (${car.review})`);
      skipped += 1;
      continue;
    }

    const folderPath = join(SRC_DIR, car.folder);
    if (!existsSync(folderPath)) {
      console.warn(`  ! ${label} — source folder not found (${car.folder})`);
      skipped += 1;
      continue;
    }

    const { price, body } = readSourceText(folderPath);
    if (price === null) {
      console.warn(`  ! ${label} — no price in the source files, skipped`);
      skipped += 1;
      continue;
    }

    const description = car.review ? "" : withSpecLine(extractDescription(body), body);
    const mileage = car.mileage ?? Number(spec(body, "Mileage")?.replace(/[^\d]/g, "") ?? 0);

    const publicBase = `${config.publicUploadPath.replace(/\/$/, "")}/${DEST_REL}/${car.slug}`;
    const photos = dryRun
      ? []
      : await copyPhotos(
          folderPath,
          join(config.uploadDir, DEST_REL, car.slug),
          publicBase,
          resize,
          car.cover,
        );

    const entry: ManifestCar = {
      slug: car.slug,
      year: car.year,
      make: car.make,
      model: car.model,
      price,
      mileage,
      description,
      photos,
      ...(spec(body, "VIN") ? { vin: spec(body, "VIN")! } : {}),
      ...(car.review ? { review: car.review } : {}),
    };
    // Every processed car goes into the manifest — it is the full picture of
    // this batch, which the server replays regardless of what it already has.
    manifest.push(entry);

    if (existing.has(`${car.year}|${car.make.toLowerCase()}|${car.model.toLowerCase()}`)) {
      console.log(`  = ${label} — already in the catalog, photos refreshed`);
      skipped += 1;
      continue;
    }

    if (!dryRun) createCar(db, entry);
    imported += 1;
    console.log(`  + ${label} — $${price.toLocaleString("en-US")}, ${mileage.toLocaleString("en-US")} mi, ${photos.length} photos`);
  }

  if (!dryRun) {
    mkdirSync("data", { recursive: true });
    writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }
  db.close();

  console.log(
    `\n${dryRun ? "[dry run] " : ""}Imported ${imported} cars, skipped ${skipped}, into ${config.databasePath}.`,
  );
  if (!dryRun) console.log(`Manifest: ${MANIFEST_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
