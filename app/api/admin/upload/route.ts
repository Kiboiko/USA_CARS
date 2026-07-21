// MOCK — POST /api/admin/upload (multipart: file) → { url }
// Does not persist the file; returns a placeholder URL so the admin UI flow
// works. Role 1 stores the file and returns its real URL.
import { NextResponse } from "next/server";
import { requireAuth } from "@/app/api/_mock";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const unauth = requireAuth(req);
  if (unauth) return unauth;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 422 });
  }

  // Deterministic placeholder based on file name so the UI shows something.
  const seed = encodeURIComponent(file.name.replace(/\.[^.]+$/, "") || "upload");
  return NextResponse.json({ url: `https://picsum.photos/seed/${seed}/1200/800` });
}
