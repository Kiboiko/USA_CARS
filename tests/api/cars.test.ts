import { describe, it, expect, beforeEach } from "vitest";
import { getDb, resetDb } from "@/lib/db/connection";
import { resetConfigCache } from "@/lib/config";
import { GET as listCarsRoute } from "@/app/api/cars/route";
import { GET as getCarRoute } from "@/app/api/cars/[id]/route";
import { seedCar } from "../helpers";

beforeEach(() => {
  resetDb();
  resetConfigCache();
});

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/cars", () => {
  it("returns an empty array when there are no cars", async () => {
    const res = await listCarsRoute();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns list items in contract shape", async () => {
    seedCar(getDb(), { make: "Kia", photos: ["/k.jpg"] });
    const res = await listCarsRoute();
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ make: "Kia", photo_cover: "/k.jpg" });
    expect(body[0]).not.toHaveProperty("description");
  });

  it("leaves a sold car out of the public list", async () => {
    seedCar(getDb(), { make: "Available" });
    seedCar(getDb(), { make: "Gone", sold: true });
    const res = await listCarsRoute();
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ make: "Available" });
  });
});

describe("GET /api/cars/:id", () => {
  it("returns a single car with full detail", async () => {
    const car = seedCar(getDb());
    const res = await getCarRoute(new Request("http://t/"), ctx(String(car.id)));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ id: car.id, description: "Nice car" });
    expect(body.photos).toEqual(["/uploads/a.jpg", "/uploads/b.jpg"]);
  });

  it("returns 404 for a missing car", async () => {
    const res = await getCarRoute(new Request("http://t/"), ctx("999"));
    expect(res.status).toBe(404);
  });

  it("returns 400 for a non-numeric id", async () => {
    const res = await getCarRoute(new Request("http://t/"), ctx("abc"));
    expect(res.status).toBe(400);
  });

  it("still resolves a sold car by id — its own page keeps working", async () => {
    const car = seedCar(getDb(), { sold: true });
    const res = await getCarRoute(new Request("http://t/"), ctx(String(car.id)));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sold).toBe(true);
  });
});
