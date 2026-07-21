// MOCK — GET /api/cars/:id → full CarDetail
import { NextResponse } from "next/server";
import { cars } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const car = cars.find((c) => c.id === Number(params.id));
  if (!car) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(car);
}
