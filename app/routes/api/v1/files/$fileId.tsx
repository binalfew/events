import * as fs from "node:fs/promises";
import { data } from "react-router";
import { requireAuth } from "~/lib/require-auth.server";
import { getFileMetadata } from "~/services/file-upload.server";
import type { Route } from "./+types/$fileId";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { user } = await requireAuth(request);
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const meta = await getFileMetadata(params.fileId);
  if (!meta) {
    throw data({ error: "File not found" }, { status: 404 });
  }

  if (meta.tenantId !== tenantId) {
    throw data({ error: "Forbidden" }, { status: 403 });
  }

  let fileBytes: Buffer;
  try {
    fileBytes = await fs.readFile(meta.filePath);
  } catch {
    throw data({ error: "File not found on disk" }, { status: 404 });
  }

  const arrayBuffer = new ArrayBuffer(fileBytes.byteLength);
  new Uint8Array(arrayBuffer).set(fileBytes);

  return new Response(arrayBuffer, {
    headers: {
      "Content-Type": meta.mimeType,
      "Content-Disposition": `inline; filename="${meta.originalName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
