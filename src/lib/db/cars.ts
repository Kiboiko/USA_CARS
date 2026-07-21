import type { Db } from "./connection";

/** A car row as stored in the database. */
export interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  description: string;
  photos: string[];
  created_at: string;
  updated_at: string;
}

/** Shape used to create/update a car. */
export interface CarInput {
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  description?: string;
  photos?: string[];
}

/** List item shape for `GET /api/cars` (ТЗ §6). */
export interface CarListItem {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  photo_cover: string | null;
}

interface CarRow {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  description: string;
  photos: string;
  created_at: string;
  updated_at: string;
}

function parsePhotos(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p) => typeof p === "string") : [];
  } catch {
    return [];
  }
}

function mapRow(row: CarRow): Car {
  return { ...row, photos: parsePhotos(row.photos) };
}

/** List all cars, newest first, in the public list-item shape. */
export function listCars(db: Db): CarListItem[] {
  const rows = db
    .prepare("SELECT id, make, model, year, price, mileage, photos FROM cars ORDER BY created_at DESC, id DESC")
    .all() as Array<Omit<CarRow, "description" | "created_at" | "updated_at">>;
  return rows.map((row) => {
    const photos = parsePhotos(row.photos);
    return {
      id: row.id,
      make: row.make,
      model: row.model,
      year: row.year,
      price: row.price,
      mileage: row.mileage,
      photo_cover: photos[0] ?? null,
    };
  });
}

/**
 * List all cars, newest first, as full rows (with photos array + description).
 * Used by the admin panel, which needs the complete car — unlike the public
 * list which only needs a cover photo.
 */
export function listCarsDetail(db: Db): Car[] {
  const rows = db
    .prepare("SELECT * FROM cars ORDER BY created_at DESC, id DESC")
    .all() as unknown as CarRow[];
  return rows.map(mapRow);
}

/** Fetch a single car by id, or null if not found. */
export function getCar(db: Db, id: number): Car | null {
  const row = db.prepare("SELECT * FROM cars WHERE id = ?").get(id) as CarRow | undefined;
  return row ? mapRow(row) : null;
}

/** Insert a new car and return the created row. */
export function createCar(db: Db, input: CarInput): Car {
  const result = db
    .prepare(
      `INSERT INTO cars (make, model, year, price, mileage, description, photos)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.make,
      input.model,
      input.year,
      input.price,
      input.mileage ?? 0,
      input.description ?? "",
      JSON.stringify(input.photos ?? []),
    );
  const created = getCar(db, Number(result.lastInsertRowid));
  if (!created) throw new Error("Failed to load car after insert");
  return created;
}

/** Update an existing car, returning the updated row or null if it doesn't exist. */
export function updateCar(db: Db, id: number, input: CarInput): Car | null {
  const existing = getCar(db, id);
  if (!existing) return null;
  db.prepare(
    `UPDATE cars
       SET make = ?, model = ?, year = ?, price = ?, mileage = ?, description = ?, photos = ?,
           updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    input.make,
    input.model,
    input.year,
    input.price,
    input.mileage ?? 0,
    input.description ?? "",
    JSON.stringify(input.photos ?? []),
    id,
  );
  return getCar(db, id);
}

/** Delete a car. Returns true if a row was removed. */
export function deleteCar(db: Db, id: number): boolean {
  const result = db.prepare("DELETE FROM cars WHERE id = ?").run(id);
  return result.changes > 0;
}
