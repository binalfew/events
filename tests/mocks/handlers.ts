import { http, HttpResponse } from "msw";

// In-memory storage for blob mock
const blobStore = new Map<string, ArrayBuffer>();

// In-memory storage for email mock
export const sentEmails: Array<{
  to: string;
  subject: string;
  body: string;
}> = [];

export const handlers = [
  // Azure Blob Storage - Upload
  http.put("https://*.blob.core.windows.net/:container/:blob", async ({ params, request }) => {
    const key = `${params.container}/${params.blob}`;
    const body = await request.arrayBuffer();
    blobStore.set(key, body);
    return new HttpResponse(null, { status: 201 });
  }),

  // Azure Blob Storage - Download
  http.get("https://*.blob.core.windows.net/:container/:blob", ({ params }) => {
    const key = `${params.container}/${params.blob}`;
    const data = blobStore.get(key);
    if (!data) return new HttpResponse(null, { status: 404 });
    return new HttpResponse(data, { status: 200 });
  }),

  // Azure Communication Services - Send Email
  http.post("https://*.communication.azure.com/emails\\:send*", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    sentEmails.push({
      to: String((body as any).recipients?.to?.[0]?.address ?? ""),
      subject: String((body as any).content?.subject ?? ""),
      body: String((body as any).content?.html ?? ""),
    });
    return HttpResponse.json({
      id: "mock-email-id",
      status: "Succeeded",
    });
  }),
];
