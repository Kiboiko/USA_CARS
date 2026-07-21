import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getDb, resetDb } from "@/lib/db/connection";
import { resetConfigCache } from "@/lib/config";
import { POST as upload } from "@/app/api/admin/upload/route";
import { authHeader, makeAdminToken } from "../helpers";

let token: string;
let dir: string;

beforeEach(async () => {
  resetDb();
  dir = mkdtempSync(join(tmpdir(), "usacars-upload-"));
  process.env.UPLOAD_DIR = dir;
  process.env.PUBLIC_UPLOAD_PATH = "/uploads";
  resetConfigCache();
  token = await makeAdminToken(getDb());
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  delete process.env.UPLOAD_DIR;
  resetConfigCache();
});

function multipart(file: File | null, headers: Record<string, string>): Request {
  const form = new FormData();
  if (file) form.set("file", file);
  return new Request("http://t/api/admin/upload", { method: "POST", headers, body: form });
}

describe("POST /api/admin/upload", () => {
  it("rejects without a token", async () => {
    const res = await upload(multipart(new File(["x"], "a.png", { type: "image/png" }), {}));
    expect(res.status).toBe(401);
  });

  it("uploads a file and writes it to disk", async () => {
    const file = new File(["imagedata"], "car.png", { type: "image/png" });
    const res = await upload(multipart(file, authHeader(token)));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.url).toMatch(/^\/uploads\/.+\.png$/);
    const files = readdirSync(dir);
    expect(files).toHaveLength(1);
    expect(existsSync(join(dir, files[0]))).toBe(true);
  });

  it("returns 400 when the file field is missing", async () => {
    const res = await upload(multipart(null, authHeader(token)));
    expect(res.status).toBe(400);
  });

  it("returns 415 for an unsupported file type", async () => {
    const file = new File(["x"], "doc.pdf", { type: "application/pdf" });
    const res = await upload(multipart(file, authHeader(token)));
    expect(res.status).toBe(415);
  });
});
