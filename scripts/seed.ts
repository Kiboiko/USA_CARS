import { createDatabase } from "../src/lib/db/connection";
import { loadConfig } from "../src/lib/config";
import {
  seedAdmins,
  seedCarsIfEmpty,
  adminsFromEnv,
  SAMPLE_CARS,
} from "../src/lib/db/bootstrap";

/**
 * Seed the database with the two admin logins (from env) and sample cars.
 * Idempotent: admin passwords are refreshed; cars are only inserted if empty.
 */
async function main(): Promise<void> {
  process.env.JWT_SECRET ??= "seed-only";
  const config = loadConfig();
  const db = createDatabase(config.databasePath);

  const admins = adminsFromEnv(process.env);
  if (admins.length === 0) {
    console.warn(
      "No admin credentials in env (ADMIN1_USERNAME/ADMIN1_PASSWORD, ADMIN2_*). Skipping admins.",
    );
  }
  const adminCount = await seedAdmins(db, admins);
  const carCount = seedCarsIfEmpty(db, SAMPLE_CARS);

  db.close();
  console.log(`Seeded ${adminCount} admin(s) and ${carCount} sample car(s) into ${config.databasePath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
