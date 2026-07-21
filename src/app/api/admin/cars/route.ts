import { getDb } from "@/lib/db/connection";
import { listCars, createCar } from "@/lib/db/cars";
import { requireAdmin } from "@/lib/adminGuard";
import { carSchema, formatZodError } from "@/lib/validation";
import { json, jsonError, parseJsonBody, withErrorHandling } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET /api/admin/cars → list (admin)
export const GET = withErrorHandling(async (req: Request): Promise<Response> => {
  await requireAdmin(req);
  return json(listCars(getDb()));
});

// POST /api/admin/cars  body: { make, model, year, price, mileage, description, photos }
export const POST = withErrorHandling(async (req: Request): Promise<Response> => {
  await requireAdmin(req);
  const body = await parseJsonBody(req);
  const parsed = carSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(formatZodError(parsed.error), 400);
  }
  const car = createCar(getDb(), parsed.data);
  return json(car, { status: 201 });
});
