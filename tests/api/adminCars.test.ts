import { describe, it, expect, beforeEach } from "vitest";
import { getDb, resetDb } from "@/lib/db/connection";
import { resetConfigCache } from "@/lib/config";
import { GET as listAdminCars, POST as createAdminCar } from "@/app/api/admin/cars/route";
import {
  GET as getAdminCar,
  PUT as putAdminCar,
  DELETE as deleteAdminCar,
} from "@/app/api/admin/cars/[id]/route";
import { getCar } from "@/lib/db/cars";
import { jsonRequest, authHeader, makeAdminToken, seedCar } from "../helpers";

let token: string;

beforeEach(async () => {
  resetDb();
  resetConfigCache();
  token = await makeAdminToken(getDb());
});

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

const validCar = {
  make: "Ford",
  model: "Focus",
  year: 2020,
  price: 15000,
  mileage: 30000,
  description: "clean",
  photos: ["/uploads/x.jpg"],
};

describe("admin cars — auth", () => {
  it("rejects list without a token", async () => {
    const res = await listAdminCars(new Request("http://t/api/admin/cars"));
    expect(res.status).toBe(401);
  });

  it("rejects create with an invalid token", async () => {
    const res = await createAdminCar(
      jsonRequest("http://t/api/admin/cars", "POST", validCar, authHeader("garbage")),
    );
    expect(res.status).toBe(401);
  });
});

describe("admin cars — CRUD", () => {
  it("creates a car (201) and returns it", async () => {
    const res = await createAdminCar(
      jsonRequest("http://t/api/admin/cars", "POST", validCar, authHeader(token)),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ make: "Ford", model: "Focus" });
    expect(getCar(getDb(), body.id)).not.toBeNull();
  });

  it("rejects invalid car payloads with 400", async () => {
    const res = await createAdminCar(
      jsonRequest("http://t/api/admin/cars", "POST", { make: "", model: "x", year: 2020, price: 1 }, authHeader(token)),
    );
    expect(res.status).toBe(400);
  });

  it("lists cars for the admin with full detail (photos array + description)", async () => {
    seedCar(getDb(), { photos: ["/a.jpg", "/b.jpg"], description: "full" });
    const res = await listAdminCars(new Request("http://t/api/admin/cars", { headers: authHeader(token) }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    // Admin needs the full car, not the public list-item shape.
    expect(Array.isArray(body[0].photos)).toBe(true);
    expect(body[0].photos).toEqual(["/a.jpg", "/b.jpg"]);
    expect(body[0].description).toBe("full");
  });

  it("gets a single car by id", async () => {
    const car = seedCar(getDb());
    const res = await getAdminCar(
      new Request("http://t/", { headers: authHeader(token) }),
      ctx(String(car.id)),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).id).toBe(car.id);
  });

  it("updates a car", async () => {
    const car = seedCar(getDb());
    const res = await putAdminCar(
      jsonRequest("http://t/", "PUT", { ...validCar, make: "Updated" }, authHeader(token)),
      ctx(String(car.id)),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).make).toBe("Updated");
    expect(getCar(getDb(), car.id)!.make).toBe("Updated");
  });

  it("returns 404 when updating a missing car", async () => {
    const res = await putAdminCar(
      jsonRequest("http://t/", "PUT", validCar, authHeader(token)),
      ctx("999"),
    );
    expect(res.status).toBe(404);
  });

  it("deletes a car", async () => {
    const car = seedCar(getDb());
    const res = await deleteAdminCar(
      new Request("http://t/", { method: "DELETE", headers: authHeader(token) }),
      ctx(String(car.id)),
    );
    expect(res.status).toBe(200);
    expect(getCar(getDb(), car.id)).toBeNull();
  });

  it("returns 404 when deleting a missing car", async () => {
    const res = await deleteAdminCar(
      new Request("http://t/", { method: "DELETE", headers: authHeader(token) }),
      ctx("999"),
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid id", async () => {
    const res = await getAdminCar(
      new Request("http://t/", { headers: authHeader(token) }),
      ctx("abc"),
    );
    expect(res.status).toBe(400);
  });
});
