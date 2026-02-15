import { data } from "react-router";
import { requirePermission } from "~/lib/require-auth.server";
import { processFileUpload, FileUploadError } from "~/services/file-upload.server";
import type { Route } from "./+types/index";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw data({ error: "Method not allowed" }, { status: 405 });
  }

  const { user } = await requirePermission(request, "file", "upload");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return data({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return data({ error: "No file provided" }, { status: 400 });
  }

  try {
    const result = await processFileUpload(file, {
      tenantId,
      uploadedBy: user.id,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    if (!result.allowed) {
      return data({ error: result.reason }, { status: 422 });
    }

    return data({ data: { fileId: result.fileId, url: result.url } }, { status: 201 });
  } catch (error) {
    if (error instanceof FileUploadError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
