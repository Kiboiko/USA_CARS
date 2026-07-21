import type { Db } from "./connection";
import { hashPassword } from "../services/auth";
import { upsertAdmin, countAdmins } from "./adminUsers";
import { createCar, type CarInput } from "./cars";

/**
 * Reusable, testable bootstrap helpers used by the CLI scripts
 * (scripts/migrate.ts, scripts/seed.ts). Kept out of the scripts themselves so
 * the logic can be unit-tested against an in-memory database.
 */

export interface AdminSeed {
  username: string;
  password: string;
}

/** Create/refresh the two agreed admin logins (ТЗ §2). */
export async function seedAdmins(db: Db, admins: AdminSeed[]): Promise<number> {
  let count = 0;
  for (const admin of admins) {
    if (!admin.username || !admin.password) continue;
    const hash = await hashPassword(admin.password);
    upsertAdmin(db, admin.username, hash);
    count += 1;
  }
  return count;
}

/** Insert sample cars only if the table is empty. Returns number inserted. */
export function seedCarsIfEmpty(db: Db, cars: CarInput[]): number {
  const existing = db.prepare("SELECT COUNT(*) AS n FROM cars").get() as { n: number };
  if (existing.n > 0) return 0;
  for (const car of cars) createCar(db, car);
  return cars.length;
}

/**
 * Parse admin credentials from environment variables.
 * ADMIN1_USERNAME / ADMIN1_PASSWORD, ADMIN2_USERNAME / ADMIN2_PASSWORD.
 */
export function adminsFromEnv(env: NodeJS.ProcessEnv): AdminSeed[] {
  const admins: AdminSeed[] = [];
  for (const n of [1, 2]) {
    const username = env[`ADMIN${n}_USERNAME`];
    const password = env[`ADMIN${n}_PASSWORD`];
    if (username && password) admins.push({ username, password });
  }
  return admins;
}

// Demo photos use picsum (allowed in next.config images.remotePatterns) so the
// seeded inventory renders real images before the client uploads their own.
function demoPhotos(seed: string, n = 3): string[] {
  return Array.from({ length: n }, (_, i) => `https://picsum.photos/seed/${seed}-${i + 1}/1200/800`);
}

export const SAMPLE_CARS: CarInput[] = [
  {
    make: "Toyota",
    model: "Camry SE",
    year: 2021,
    price: 24500,
    mileage: 32000,
    description: "Clean title, one owner, full service history. Apple CarPlay, backup camera.",
    photos: demoPhotos("camry"),
  },
  {
    make: "Ford",
    model: "Mustang GT",
    year: 2019,
    price: 32900,
    mileage: 41000,
    description: "GT 5.0 V8, premium package, performance exhaust.",
    photos: demoPhotos("mustang"),
  },
  {
    make: "Honda",
    model: "Civic Touring",
    year: 2022,
    price: 23200,
    mileage: 18000,
    description: "Fuel efficient, like new, heated seats.",
    photos: demoPhotos("civic"),
  },
  {
    make: "Tesla",
    model: "Model 3",
    year: 2021,
    price: 34990,
    mileage: 22100,
    description: "Long Range AWD, autopilot, one owner.",
    photos: demoPhotos("model3"),
  },
  {
    make: "Jeep",
    model: "Wrangler Sahara",
    year: 2021,
    price: 39900,
    mileage: 25300,
    description: "4x4, hardtop, tow package.",
    photos: demoPhotos("wrangler"),
  },
  {
    make: "BMW",
    model: "330i xDrive",
    year: 2020,
    price: 29900,
    mileage: 37600,
    description: "M Sport package, navigation, sunroof.",
    photos: demoPhotos("bmw330"),
  },
];

export { countAdmins };
