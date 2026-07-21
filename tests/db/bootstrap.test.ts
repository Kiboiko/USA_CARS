import { describe, it, expect, beforeEach } from "vitest";
import type { Db } from "@/lib/db/connection";
import {
  seedAdmins,
  seedCarsIfEmpty,
  adminsFromEnv,
  SAMPLE_CARS,
  countAdmins,
} from "@/lib/db/bootstrap";
import { getAdminByUsername } from "@/lib/db/adminUsers";
import { verifyPassword } from "@/lib/services/auth";
import { listCars } from "@/lib/db/cars";
import { makeDb, seedCar } from "../helpers";

describe("bootstrap helpers", () => {
  let db: Db;
  beforeEach(() => {
    db = makeDb();
  });

  it("seeds admins with hashed (verifiable) passwords", async () => {
    const n = await seedAdmins(db, [{ username: "a", password: "pw1" }]);
    expect(n).toBe(1);
    const user = getAdminByUsername(db, "a")!;
    expect(user.password_hash).not.toBe("pw1");
    expect(await verifyPassword("pw1", user.password_hash)).toBe(true);
  });

  it("skips admin entries with empty fields", async () => {
    const n = await seedAdmins(db, [
      { username: "", password: "x" },
      { username: "y", password: "" },
    ]);
    expect(n).toBe(0);
    expect(countAdmins(db)).toBe(0);
  });

  it("seeds sample cars only when the table is empty", () => {
    expect(seedCarsIfEmpty(db, SAMPLE_CARS)).toBe(SAMPLE_CARS.length);
    expect(listCars(db)).toHaveLength(SAMPLE_CARS.length);
    // second run is a no-op
    expect(seedCarsIfEmpty(db, SAMPLE_CARS)).toBe(0);
  });

  it("does not seed cars when some already exist", () => {
    seedCar(db);
    expect(seedCarsIfEmpty(db, SAMPLE_CARS)).toBe(0);
    expect(listCars(db)).toHaveLength(1);
  });

  it("parses admin credentials from env", () => {
    const env = {
      ADMIN1_USERNAME: "u1",
      ADMIN1_PASSWORD: "p1",
      ADMIN2_USERNAME: "u2",
      ADMIN2_PASSWORD: "p2",
    } as unknown as NodeJS.ProcessEnv;
    expect(adminsFromEnv(env)).toEqual([
      { username: "u1", password: "p1" },
      { username: "u2", password: "p2" },
    ]);
  });

  it("ignores partial admin env entries", () => {
    const env = { ADMIN1_USERNAME: "u1" } as unknown as NodeJS.ProcessEnv;
    expect(adminsFromEnv(env)).toEqual([]);
  });
});
