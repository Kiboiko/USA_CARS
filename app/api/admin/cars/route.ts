// MOCK — GET /api/admin/cars (list) · POST /api/admin/cars (create)
import { NextResponse } from "next/server";
import { requireAuth } from "@/app/api/_mock";
import { cars, nextCarId } from "@/lib/mock-data";
import type { CarInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const unauth = requireAuth(req);
  if (unauth) return unauth;
  return NextResponse.json(cars);
}

export async function POST(req: Request) {
  const unauth = requireAuth(req);
  if (unauth) return unauth;

  let body: Partial<CarInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const car = {
    id: nextCarId(),
    make: (body.make ?? "").trim(),
    model: (body.model ?? "").trim(),
    year: Number(body.year) || new Date().getFullYear(),
    price: Number(body.price) || 0,
    mileage: Number(body.mileage) || 0,
    description: (body.description ?? "").trim(),
    photos: Array.isArray(body.photos) ? body.photos : [],
  };
  cars.push(car);
  return NextResponse.json(car, { status: 201 });
}
