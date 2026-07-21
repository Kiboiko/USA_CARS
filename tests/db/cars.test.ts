import { describe, it, expect, beforeEach } from "vitest";
import type { Db } from "@/lib/db/connection";
import { listCars, getCar, createCar, updateCar, deleteCar } from "@/lib/db/cars";
import { makeDb, seedCar } from "../helpers";

describe("cars repository", () => {
  let db: Db;
  beforeEach(() => {
    db = makeDb();
  });

  it("creates a car and reads it back with parsed photos", () => {
    const car = createCar(db, {
      make: "Ford",
      model: "Focus",
      year: 2018,
      price: 12000,
      mileage: 60000,
      description: "hi",
      photos: ["/x.jpg"],
    });
    expect(car.id).toBeGreaterThan(0);
    expect(car.photos).toEqual(["/x.jpg"]);

    const fetched = getCar(db, car.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.make).toBe("Ford");
    expect(fetched!.photos).toEqual(["/x.jpg"]);
    expect(fetched!.created_at).toBeTruthy();
  });

  it("applies defaults for optional fields", () => {
    const car = createCar(db, { make: "A", model: "B", year: 2000, price: 1 });
    expect(car.mileage).toBe(0);
    expect(car.description).toBe("");
    expect(car.photos).toEqual([]);
  });

  it("returns null for a missing car", () => {
    expect(getCar(db, 999)).toBeNull();
  });

  it("lists cars newest-first with photo_cover from first photo", () => {
    const a = seedCar(db, { make: "First", photos: ["/first.jpg"] });
    const b = seedCar(db, { make: "Second", photos: [] });
    const list = listCars(db);
    expect(list).toHaveLength(2);
    // b created after a → appears first
    expect(list[0].id).toBe(b.id);
    expect(list[0].photo_cover).toBeNull();
    const first = list.find((c) => c.id === a.id)!;
    expect(first.photo_cover).toBe("/first.jpg");
    // list items don't leak description
    expect(first).not.toHaveProperty("description");
  });

  it("updates a car and bumps nothing it shouldn't", () => {
    const car = seedCar(db);
    const updated = updateCar(db, car.id, {
      make: "Changed",
      model: car.model,
      year: car.year,
      price: 99999,
      mileage: 10,
      description: "new",
      photos: ["/c.jpg"],
    });
    expect(updated).not.toBeNull();
    expect(updated!.make).toBe("Changed");
    expect(updated!.price).toBe(99999);
    expect(updated!.photos).toEqual(["/c.jpg"]);
  });

  it("returns null when updating a missing car", () => {
    expect(updateCar(db, 12345, { make: "x", model: "y", year: 2000, price: 1 })).toBeNull();
  });

  it("deletes a car and reports whether a row was removed", () => {
    const car = seedCar(db);
    expect(deleteCar(db, car.id)).toBe(true);
    expect(getCar(db, car.id)).toBeNull();
    expect(deleteCar(db, car.id)).toBe(false);
  });

  it("tolerates corrupt photos JSON by returning an empty array", () => {
    const car = seedCar(db);
    db.prepare("UPDATE cars SET photos = ? WHERE id = ?").run("{not json", car.id);
    expect(getCar(db, car.id)!.photos).toEqual([]);
    expect(listCars(db)[0].photo_cover).toBeNull();
  });
});
