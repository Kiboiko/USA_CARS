import { describe, it, expect } from "vitest";
import { json, jsonError, parseJsonBody, withErrorHandling, HttpError } from "@/lib/http";

describe("http helpers", () => {
  it("json() sets content-type and serialises the body", async () => {
    const res = json({ a: 1 }, { status: 201 });
    expect(res.status).toBe(201);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ a: 1 });
  });

  it("jsonError() shapes an error response", async () => {
    const res = jsonError("nope", 404);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "nope" });
  });

  it("parseJsonBody parses valid JSON", async () => {
    const req = new Request("http://t/", { method: "POST", body: JSON.stringify({ x: 1 }) });
    expect(await parseJsonBody(req)).toEqual({ x: 1 });
  });

  it("parseJsonBody throws HttpError(400) on malformed JSON", async () => {
    const req = new Request("http://t/", { method: "POST", body: "{bad" });
    await expect(parseJsonBody(req)).rejects.toMatchObject({ status: 400 });
  });

  it("withErrorHandling converts HttpError to a JSON response", async () => {
    const handler = withErrorHandling(async () => {
      throw new HttpError(403, "forbidden");
    });
    const res = await handler(new Request("http://t/"), {});
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "forbidden" });
  });

  it("withErrorHandling converts unknown errors to a generic 500", async () => {
    const handler = withErrorHandling(async () => {
      throw new Error("boom");
    });
    const res = await handler(new Request("http://t/"), {});
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error" });
  });

  it("withErrorHandling passes through successful responses", async () => {
    const handler = withErrorHandling(async () => json({ ok: true }));
    const res = await handler(new Request("http://t/"), {});
    expect(await res.json()).toEqual({ ok: true });
  });
});
