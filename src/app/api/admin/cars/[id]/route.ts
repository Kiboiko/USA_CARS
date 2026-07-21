import { getDb } from "@/lib/db/connection";
import { getCar, updateCar, deleteCar } from "@/lib/db/cars";
import { requireAdmin } from "@/lib/adminGuard";
import { carSchema, formatZodError } from "@/lib/validation";
import { json, jsonError, parseJsonBody, withErrorHandling, HttpError } from "@/lib/http";

export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

function parseId(id: string): number {
  const carId = Number(id);
  if (!Number.isInteger(carId) || carId <= 0) {
    throw new HttpError(400, "Invalid car id");
  }
  return carId;
}

// GET /api/admin/cars/:id
export const GET = withErrorHandling(async (req: Request, ctx: Ctx): Promise<Response> => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  const car = getCar(getDb(), parseId(id));
  if (!car) return jsonError("Car not found", 404);
  return json(car);
});

// PUT /api/admin/cars/:id
export const PUT = withErrorHandling(async (req: Request, ctx: Ctx): Promise<Response> => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  const carId = parseId(id);
  const body = await parseJsonBody(req);
  const parsed = carSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(formatZodError(parsed.error), 400);
  }
  const car = updateCar(getDb(), carId, parsed.data);
  if (!car) return jsonError("Car not found", 404);
  return json(car);
});

// DELETE /api/admin/cars/:id
export const DELETE = withErrorHandling(async (req: Request, ctx: Ctx): Promise<Response> => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  const removed = deleteCar(getDb(), parseId(id));
  if (!removed) return jsonError("Car not found", 404);
  return json({ ok: true });
});
