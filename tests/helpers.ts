import { createDatabase, type Db } from "@/lib/db/connection";
import { hashPassword, signAdminToken } from "@/lib/services/auth";
import { upsertAdmin } from "@/lib/db/adminUsers";
import { createCar, type CarInput } from "@/lib/db/cars";

/** Fresh in-memory database with the full schema applied. */
export function makeDb(): Db {
  return createDatabase(":memory:");
}

/** Insert an admin and return a valid bearer token for it. */
export async function makeAdminToken(
  db: Db,
  username = "admin1",
  password = "secret123",
  secret = process.env.JWT_SECRET!,
): Promise<string> {
  const hash = await hashPassword(password);
  const user = upsertAdmin(db, username, hash);
  return signAdminToken({ id: user.id, username: user.username }, secret, "12h");
}

export function seedCar(db: Db, overrides: Partial<CarInput> = {}) {
  return createCar(db, {
    make: "Toyota",
    model: "Corolla",
    year: 2020,
    price: 18000,
    mileage: 25000,
    description: "Nice car",
    photos: ["/uploads/a.jpg", "/uploads/b.jpg"],
    ...overrides,
  });
}

/** Build a JSON Request for route-handler tests. */
export function jsonRequest(url: string, method: string, body?: unknown, headers: Record<string, string> = {}): Request {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function authHeader(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}
