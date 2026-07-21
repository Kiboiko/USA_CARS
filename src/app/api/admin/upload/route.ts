import { getConfig } from "@/lib/config";
import { requireAdmin } from "@/lib/adminGuard";
import { saveUpload } from "@/lib/services/upload";
import { json, jsonError, withErrorHandling, HttpError } from "@/lib/http";

export const dynamic = "force-dynamic";

// POST /api/admin/upload  multipart: file → { url }
export const POST = withErrorHandling(async (req: Request): Promise<Response> => {
  await requireAdmin(req);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, "Expected multipart/form-data");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return jsonError("Missing 'file' field", 400);
  }

  const config = getConfig();
  const result = await saveUpload(file, {
    uploadDir: config.uploadDir,
    publicPath: config.publicUploadPath,
    maxBytes: config.maxUploadBytes,
  });
  return json({ url: result.url }, { status: 201 });
});
