import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { HttpError } from "../http";

/**
 * Car photo upload (ТЗ §2.3 / §6 `POST /api/admin/upload`).
 *
 * Saves to the local uploads dir and returns a public URL. The filesystem
 * functions are injectable so the logic (validation, naming) can be unit-tested
 * without touching disk.
 */

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export interface UploadOptions {
  uploadDir: string;
  publicPath: string;
  maxBytes: number;
}

export interface UploadDeps {
  mkdir?: typeof mkdir;
  writeFile?: typeof writeFile;
  randomName?: () => string;
}

export interface UploadResult {
  url: string;
  filename: string;
  bytes: number;
}

function extensionFor(file: File): string {
  const byType = ALLOWED_TYPES[file.type];
  if (byType) return byType;
  const byName = extname(file.name).toLowerCase();
  const known = Object.values(ALLOWED_TYPES);
  if (known.includes(byName === ".jpeg" ? ".jpg" : byName)) {
    return byName === ".jpeg" ? ".jpg" : byName;
  }
  throw new HttpError(415, "Unsupported file type (allowed: jpeg, png, webp, gif)");
}

export async function saveUpload(
  file: File,
  options: UploadOptions,
  deps: UploadDeps = {},
): Promise<UploadResult> {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new HttpError(400, "No file provided");
  }
  if (file.size === 0) {
    throw new HttpError(400, "Empty file");
  }
  if (file.size > options.maxBytes) {
    throw new HttpError(413, `File too large (max ${options.maxBytes} bytes)`);
  }

  const ext = extensionFor(file);
  const name = (deps.randomName ?? randomUUID)();
  const filename = `${name}${ext}`;

  const mkdirFn = deps.mkdir ?? mkdir;
  const writeFn = deps.writeFile ?? writeFile;

  await mkdirFn(options.uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFn(join(options.uploadDir, filename), buffer);

  const url = `${options.publicPath.replace(/\/$/, "")}/${filename}`;
  return { url, filename, bytes: buffer.length };
}
