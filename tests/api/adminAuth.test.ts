import { describe, it, expect, beforeEach } from "vitest";
import { getDb, resetDb } from "@/lib/db/connection";
import { resetConfigCache } from "@/lib/config";
import { POST as login } from "@/app/api/admin/login/route";
import { upsertAdmin } from "@/lib/db/adminUsers";
import { hashPassword } from "@/lib/services/auth";
import { verifyAdminToken } from "@/lib/services/auth";
import { jsonRequest } from "../helpers";

beforeEach(() => {
  resetDb();
  resetConfigCache();
});

async function seedAdmin(username = "admin1", password = "secret123") {
  upsertAdmin(getDb(), username, await hashPassword(password));
}

describe("POST /api/admin/login", () => {
  it("issues a valid token for correct credentials", async () => {
    await seedAdmin();
    const res = await login(jsonRequest("http://t/api/admin/login", "POST", {
      username: "admin1",
      password: "secret123",
    }));
    expect(res.status).toBe(200);
    const { token } = await res.json();
    expect(token).toBeTruthy();
    const claims = await verifyAdminToken(token, process.env.JWT_SECRET!);
    expect(claims!.username).toBe("admin1");
  });

  it("rejects a wrong password with 401", async () => {
    await seedAdmin();
    const res = await login(jsonRequest("http://t/api/admin/login", "POST", {
      username: "admin1",
      password: "wrong",
    }));
    expect(res.status).toBe(401);
  });

  it("rejects an unknown user with the same generic 401", async () => {
    const res = await login(jsonRequest("http://t/api/admin/login", "POST", {
      username: "ghost",
      password: "whatever",
    }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Invalid credentials" });
  });

  it("returns 400 for missing fields", async () => {
    const res = await login(jsonRequest("http://t/api/admin/login", "POST", { username: "a" }));
    expect(res.status).toBe(400);
  });
});
