import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { signAdminToken } from "@/lib/services/auth";

const SECRET = process.env.JWT_SECRET!;

function req(path: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(new Request(`http://localhost${path}`, { headers }));
}

describe("admin middleware", () => {
  it("lets the login endpoint through without a token", async () => {
    const res = await middleware(req("/api/admin/login"));
    // NextResponse.next() has no explicit error status
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("blocks admin routes without a token (401)", async () => {
    const res = await middleware(req("/api/admin/cars"));
    expect(res.status).toBe(401);
  });

  it("blocks admin routes with an invalid token (401)", async () => {
    const res = await middleware(req("/api/admin/cars", { authorization: "Bearer nope" }));
    expect(res.status).toBe(401);
  });

  it("allows admin routes with a valid token", async () => {
    const token = await signAdminToken({ id: 1, username: "a" }, SECRET, "1h");
    const res = await middleware(req("/api/admin/cars", { authorization: `Bearer ${token}` }));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });
});
