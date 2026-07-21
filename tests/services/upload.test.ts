import { describe, it, expect, vi } from "vitest";
import { saveUpload, type UploadOptions } from "@/lib/services/upload";
import { HttpError } from "@/lib/http";

const options: UploadOptions = {
  uploadDir: "public/uploads",
  publicPath: "/uploads",
  maxBytes: 1024,
};

function fakeFs() {
  return {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    randomName: () => "fixed-name",
  };
}

function file(content: string, type: string, name = "photo"): File {
  return new File([content], name, { type });
}

describe("upload service", () => {
  it("saves a valid image and returns a public url", async () => {
    const fs = fakeFs();
    const result = await saveUpload(file("data", "image/png"), options, fs);
    expect(result.url).toBe("/uploads/fixed-name.png");
    expect(result.filename).toBe("fixed-name.png");
    expect(fs.mkdir).toHaveBeenCalledWith("public/uploads", { recursive: true });
    expect(fs.writeFile).toHaveBeenCalledOnce();
    const [path, buf] = fs.writeFile.mock.calls[0];
    expect(String(path).replace(/\\/g, "/")).toBe("public/uploads/fixed-name.png");
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it("derives extension from filename when type is generic", async () => {
    const fs = fakeFs();
    const result = await saveUpload(file("x", "application/octet-stream", "pic.jpeg"), options, fs);
    expect(result.url).toBe("/uploads/fixed-name.jpg");
  });

  it("rejects unsupported types", async () => {
    await expect(saveUpload(file("x", "application/pdf", "a.pdf"), options, fakeFs())).rejects.toThrow(
      HttpError,
    );
  });

  it("rejects empty files", async () => {
    await expect(saveUpload(file("", "image/png"), options, fakeFs())).rejects.toMatchObject({
      status: 400,
    });
  });

  it("rejects files larger than maxBytes", async () => {
    const big = file("x".repeat(2000), "image/png");
    await expect(saveUpload(big, options, fakeFs())).rejects.toMatchObject({ status: 413 });
  });

  it("rejects a non-file argument", async () => {
    // @ts-expect-error deliberately wrong type
    await expect(saveUpload(null, options, fakeFs())).rejects.toMatchObject({ status: 400 });
  });

  it("strips a trailing slash from the public path", async () => {
    const result = await saveUpload(file("d", "image/webp"), { ...options, publicPath: "/uploads/" }, fakeFs());
    expect(result.url).toBe("/uploads/fixed-name.webp");
  });
});
