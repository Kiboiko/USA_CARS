// MOCK — PUT /api/admin/cars/:id (update) · DELETE /api/admin/cars/:id
import { NextResponse } from "next/server";
import { requireAuth } from "@/app/api/_mock";
import { cars } from "@/lib/mock-data";
import type { CarInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  const unauth = requireAuth(req);
  if (unauth) return unauth;

  const idx = cars.findIndex((c) => c.id === Number(params.id));
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let body: Partial<CarInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const prev = cars[idx];
  cars[idx] = {
    ...prev,
    make: (body.make ?? prev.make).trim(),
    model: (body.model ?? prev.model).trim(),
    year: Number(body.year) || prev.year,
    price: Number(body.price) || prev.price,
    mileage: Number(body.mileage) ?? prev.mileage,
    description: (body.description ?? prev.description).trim(),
    photos: Array.isArray(body.photos) ? body.photos : prev.photos,
  };
  return NextResponse.json(cars[idx]);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const unauth = requireAuth(req);
  if (unauth) return unauth;

  const idx = cars.findIndex((c) => c.id === Number(params.id));
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  cars.splice(idx, 1);
  return new NextResponse(null, { status: 204 });
}
