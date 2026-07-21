import { getDb } from "@/lib/db/connection";
import { listCars } from "@/lib/db/cars";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/cars → [{ id, make, model, year, price, mileage, photo_cover }]
export async function GET(): Promise<Response> {
  return json(listCars(getDb()));
}
