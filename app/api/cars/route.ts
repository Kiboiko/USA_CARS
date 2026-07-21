// MOCK — GET /api/cars → [{ id, make, model, year, price, mileage, photo_cover }]
import { NextResponse } from "next/server";
import { cars } from "@/lib/mock-data";
import type { CarListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const list: CarListItem[] = cars.map((c) => ({
    id: c.id,
    make: c.make,
    model: c.model,
    year: c.year,
    price: c.price,
    mileage: c.mileage,
    photo_cover: c.photos[0] ?? "",
  }));
  return NextResponse.json(list);
}
