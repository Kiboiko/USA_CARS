import { getDb } from "@/lib/db/connection";
import { getCar } from "@/lib/db/cars";
import { json, jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

// GET /api/cars/:id → { id, make, model, year, price, mileage, description, photos }
export async function GET(_req: Request, ctx: Ctx): Promise<Response> {
  const { id } = await ctx.params;
  const carId = Number(id);
  if (!Number.isInteger(carId) || carId <= 0) {
    return jsonError("Invalid car id", 400);
  }
  const car = getCar(getDb(), carId);
  if (!car) return jsonError("Car not found", 404);
  return json(car);
}
