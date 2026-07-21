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

export const SAMPLE_CARS: CarInput[] = [
  {
    make: "Toyota",
    model: "Camry",
    year: 2021,
    price: 24500,
    mileage: 32000,
    description: "Clean title, one owner, full service history.",
    photos: ["/uploads/sample-camry-1.jpg", "/uploads/sample-camry-2.jpg"],
  },
  {
    make: "Ford",
    model: "Mustang",
    year: 2019,
    price: 32900,
    mileage: 41000,
    description: "GT 5.0, premium package.",
    photos: ["/uploads/sample-mustang-1.jpg"],
  },
  {
    make: "Honda",
    model: "Civic",
    year: 2022,
    price: 23200,
    mileage: 18000,
    description: "Fuel efficient, like new.",
    photos: [],
  },
];

export { countAdmins };
