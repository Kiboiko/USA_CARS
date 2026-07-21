import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  signAdminToken,
  verifyAdminToken,
  extractBearerToken,
} from "@/lib/services/auth";

const SECRET = "unit-secret";

describe("auth service", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("hunter2");
    expect(hash).not.toBe("hunter2");
    expect(await verifyPassword("hunter2", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("returns false when verifying against an empty hash", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
  });

  it("signs a token that verifies and carries claims", async () => {
    const token = await signAdminToken({ id: 7, username: "admin1" }, SECRET, "1h");
    const claims = await verifyAdminToken(token, SECRET);
    expect(claims).not.toBeNull();
    expect(claims!.sub).toBe("7");
    expect(claims!.username).toBe("admin1");
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signAdminToken({ id: 1, username: "a" }, SECRET, "1h");
    expect(await verifyAdminToken(token, "other-secret")).toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await signAdminToken({ id: 1, username: "a" }, SECRET, "0s");
    // allow the exp claim (now) to pass
    await new Promise((r) => setTimeout(r, 1100));
    expect(await verifyAdminToken(token, SECRET)).toBeNull();
  });

  it("rejects malformed / empty tokens", async () => {
    expect(await verifyAdminToken("", SECRET)).toBeNull();
    expect(await verifyAdminToken("not.a.jwt", SECRET)).toBeNull();
  });

  it("extracts bearer tokens (case-insensitive), else null", () => {
    expect(extractBearerToken("Bearer abc")).toBe("abc");
    expect(extractBearerToken("bearer  xyz  ")).toBe("xyz");
    expect(extractBearerToken("Basic abc")).toBeNull();
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken(undefined)).toBeNull();
  });
});
