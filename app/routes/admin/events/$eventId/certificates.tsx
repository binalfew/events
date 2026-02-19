import { useState } from "react";
import {
  data,
  useLoaderData,
  useActionData,
  Form,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Badge } from "~/components/ui/badge";

export const handle = { breadcrumb: "Certificates" };

// ─── Loader ──────────────────────────────────────────────

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { requirePermission } = await import("~/lib/require-auth.server");
  const { isFeatureEnabled, FEATURE_FLAG_KEYS } = await import("~/lib/feature-flags.server");
  const { listTemplates, listCertificates, getCertificateStats } =
    await import("~/services/certificates.server");

  const { user } = await requirePermission(request, "certificate", "manage");
  const tenantId = user.tenantId;
  const eventId = params.eventId!;

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.CERTIFICATES);
  if (!enabled) throw data("Feature not enabled", { status: 404 });

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") || undefined;
  const templateFilter = url.searchParams.get("templateId") || undefined;

  const [templates, certificates, stats] = await Promise.all([
    listTemplates(eventId, tenantId),
    listCertificates(eventId, tenantId, { status: statusFilter, templateId: templateFilter }),
    getCertificateStats(eventId, tenantId),
  ]);

  // Load participant types for bulk generate
  const { prisma } = await import("~/lib/db.server");
  const participantTypes = await prisma.participantType.findMany({
    where: { eventId, tenantId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return {
    templates: templates.map((t: any) => ({
      ...t,
      createdAt: t.createdAt?.toISOString?.() ?? t.createdAt,
      certificateCount: t._count?.certificates ?? 0,
    })),
    certificates: certificates.map((c: any) => ({
      ...c,
      issuedAt: c.issuedAt?.toISOString?.() ?? null,
      sentAt: c.sentAt?.toISOString?.() ?? null,
      createdAt: c.createdAt?.toISOString?.() ?? c.createdAt,
    })),
    stats,
    participantTypes,
    eventId,
    statusFilter: statusFilter ?? "",
    templateFilter: templateFilter ?? "",
  };
}

// ─── Action ──────────────────────────────────────────────

export async function action({ request, params }: ActionFunctionArgs) {
  const { requirePermission } = await import("~/lib/require-auth.server");
  const { user } = await requirePermission(request, "certificate", "manage");
  const tenantId = user.tenantId;
  const eventId = params.eventId!;

  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  const ctx = {
    userId: user.id,
    tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    if (_action === "create_template") {
      const { createTemplateSchema } = await import("~/lib/schemas/certificate");
      const { createTemplate } = await import("~/services/certificates.server");

      const parsed = createTemplateSchema.parse({
        eventId,
        name: formData.get("name"),
        description: formData.get("description"),
        layout: formData.get("layout"),
      });

      await createTemplate(parsed, ctx);
      return { success: true, message: "Template created" };
    }

    if (_action === "generate") {
      const { generateCertificateSchema } = await import("~/lib/schemas/certificate");
      const { generateCertificate } = await import("~/services/certificates.server");

      const parsed = generateCertificateSchema.parse({
        templateId: formData.get("templateId"),
        participantId: formData.get("participantId"),
      });

      await generateCertificate(parsed, ctx);
      return { success: true, message: "Certificate generated" };
    }

    if (_action === "bulk_generate") {
      const { bulkGenerateSchema } = await import("~/lib/schemas/certificate");
      const { bulkGenerateCertificates } = await import("~/services/certificates.server");

      const parsed = bulkGenerateSchema.parse({
        templateId: formData.get("templateId"),
        status: formData.get("status"),
        participantTypeId: formData.get("participantTypeId"),
      });

      const result = await bulkGenerateCertificates(parsed, eventId, ctx);
      return {
        success: true,
        message: `Generated ${result.generated} certificates (${result.skipped} skipped)`,
      };
    }

    if (_action === "send") {
      const { sendCertificate } = await import("~/services/certificates.server");
      const certificateId = formData.get("certificateId") as string;
      await sendCertificate(certificateId, ctx);
      return { success: true, message: "Certificate sent" };
    }

    if (_action === "revoke") {
      const { revokeCertificate } = await import("~/services/certificates.server");
      const certificateId = formData.get("certificateId") as string;
      const reason = (formData.get("reason") as string) || "No reason provided";
      await revokeCertificate(certificateId, reason, ctx);
      return { success: true, message: "Certificate revoked" };
    }

    return { error: "Unknown action" };
  } catch (err: any) {
    if (err.name === "CertificateError") {
      return data({ error: err.message }, { status: err.status });
    }
    if (err.issues) {
      return data({ error: err.issues.map((i: any) => i.message).join(", ") }, { status: 400 });
    }
    throw err;
  }
}

// ─── UI ──────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  GENERATED: "bg-blue-100 text-blue-800",
  SENT: "bg-green-100 text-green-800",
  DOWNLOADED: "bg-purple-100 text-purple-800",
  REVOKED: "bg-red-100 text-red-800",
};

export default function CertificatesPage() {
  const {
    templates,
    certificates,
    stats,
    participantTypes,
    eventId,
    statusFilter,
    templateFilter,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Certificates</h2>
          <p className="text-muted-foreground">Generate and manage participation certificates</p>
        </div>
      </div>

      {actionData && "error" in actionData && (
        <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
          {actionData.error}
        </div>
      )}
      {actionData && "success" in actionData && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          {actionData.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Generated</p>
          <p className="text-2xl font-bold text-blue-600">{stats.generated}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Sent</p>
          <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Downloaded</p>
          <p className="text-2xl font-bold text-purple-600">{stats.downloaded}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Revoked</p>
          <p className="text-2xl font-bold text-red-600">{stats.revoked}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Templates</p>
          <p className="text-2xl font-bold">{templates.length}</p>
        </div>
      </div>

      {/* Templates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Templates</h3>
          <Button size="sm" onClick={() => setShowTemplateForm(!showTemplateForm)}>
            {showTemplateForm ? "Cancel" : "Create Template"}
          </Button>
        </div>

        {showTemplateForm && (
          <Form method="post" className="rounded-lg border p-4 space-y-4">
            <input type="hidden" name="_action" value="create_template" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="tmpl-name">Name</Label>
                <Input
                  id="tmpl-name"
                  name="name"
                  required
                  placeholder="e.g., Attendance Certificate"
                />
              </div>
              <div>
                <Label htmlFor="tmpl-desc">Description</Label>
                <Input id="tmpl-desc" name="description" placeholder="Template description" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="tmpl-layout">Layout (HTML or JSON)</Label>
                <Textarea
                  id="tmpl-layout"
                  name="layout"
                  rows={4}
                  placeholder='{"title": "Certificate of Participation", "body": "This certifies that {{name}} participated in {{event}}"}'
                />
              </div>
            </div>
            <Button type="submit">Create Template</Button>
          </Form>
        )}

        {templates.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((tmpl: any) => (
              <div key={tmpl.id} className="rounded-lg border p-4">
                <h4 className="font-semibold">{tmpl.name}</h4>
                {tmpl.description && (
                  <p className="text-muted-foreground mt-1 text-sm">{tmpl.description}</p>
                )}
                <div className="text-muted-foreground mt-2 text-xs">
                  {tmpl.certificateCount} certificates generated
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Individual */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Generate Certificate</h3>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowGenerateForm(!showGenerateForm)}>
              {showGenerateForm ? "Cancel" : "Individual"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowBulkForm(!showBulkForm)}>
              {showBulkForm ? "Cancel" : "Bulk Generate"}
            </Button>
          </div>
        </div>

        {showGenerateForm && (
          <Form method="post" className="rounded-lg border p-4 space-y-4">
            <input type="hidden" name="_action" value="generate" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="gen-tmpl">Template</Label>
                <NativeSelect id="gen-tmpl" name="templateId" required>
                  <NativeSelectOption value="">Select template...</NativeSelectOption>
                  {templates.map((t: any) => (
                    <NativeSelectOption key={t.id} value={t.id}>
                      {t.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <Label htmlFor="gen-part">Participant ID</Label>
                <Input id="gen-part" name="participantId" required placeholder="Participant CUID" />
              </div>
            </div>
            <Button type="submit">Generate</Button>
          </Form>
        )}

        {showBulkForm && (
          <Form method="post" className="rounded-lg border p-4 space-y-4">
            <input type="hidden" name="_action" value="bulk_generate" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="bulk-tmpl">Template</Label>
                <NativeSelect id="bulk-tmpl" name="templateId" required>
                  <NativeSelectOption value="">Select template...</NativeSelectOption>
                  {templates.map((t: any) => (
                    <NativeSelectOption key={t.id} value={t.id}>
                      {t.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <Label htmlFor="bulk-type">Participant Type (optional)</Label>
                <NativeSelect id="bulk-type" name="participantTypeId">
                  <NativeSelectOption value="">All types</NativeSelectOption>
                  {participantTypes.map((pt: any) => (
                    <NativeSelectOption key={pt.id} value={pt.id}>
                      {pt.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <Label htmlFor="bulk-status">Participant Status (optional)</Label>
                <NativeSelect id="bulk-status" name="status">
                  <NativeSelectOption value="">Any status</NativeSelectOption>
                  <NativeSelectOption value="APPROVED">Approved</NativeSelectOption>
                  <NativeSelectOption value="PRINTED">Printed</NativeSelectOption>
                </NativeSelect>
              </div>
            </div>
            <Button type="submit">Bulk Generate</Button>
          </Form>
        )}
      </div>

      {/* Filters */}
      <Form method="get" className="flex flex-wrap gap-3">
        <NativeSelect name="status" defaultValue={statusFilter}>
          <NativeSelectOption value="">All statuses</NativeSelectOption>
          <NativeSelectOption value="GENERATED">Generated</NativeSelectOption>
          <NativeSelectOption value="SENT">Sent</NativeSelectOption>
          <NativeSelectOption value="DOWNLOADED">Downloaded</NativeSelectOption>
          <NativeSelectOption value="REVOKED">Revoked</NativeSelectOption>
        </NativeSelect>
        <NativeSelect name="templateId" defaultValue={templateFilter}>
          <NativeSelectOption value="">All templates</NativeSelectOption>
          {templates.map((t: any) => (
            <NativeSelectOption key={t.id} value={t.id}>
              {t.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button type="submit" size="sm" variant="outline">
          Filter
        </Button>
      </Form>

      {/* Certificate List */}
      {certificates.length === 0 ? (
        <p className="text-muted-foreground text-sm">No certificates generated yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Participant</th>
                <th className="pb-2 font-medium">Template</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">QR Code</th>
                <th className="pb-2 font-medium">Issued</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert: any) => (
                <tr key={cert.id} className="border-b">
                  <td className="py-2">
                    {cert.participant?.firstName} {cert.participant?.lastName}
                    {cert.participant?.email && (
                      <span className="text-muted-foreground ml-1 text-xs">
                        ({cert.participant.email})
                      </span>
                    )}
                  </td>
                  <td className="py-2">{cert.template?.name}</td>
                  <td className="py-2">
                    <Badge className={STATUS_COLORS[cert.status] ?? "bg-gray-100 text-gray-800"}>
                      {cert.status}
                    </Badge>
                  </td>
                  <td className="py-2 font-mono text-xs">{cert.qrCode}</td>
                  <td className="py-2">
                    {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      {cert.status !== "REVOKED" && cert.status !== "SENT" && (
                        <Form method="post" className="inline">
                          <input type="hidden" name="_action" value="send" />
                          <input type="hidden" name="certificateId" value={cert.id} />
                          <Button type="submit" size="sm" variant="outline">
                            Send
                          </Button>
                        </Form>
                      )}
                      {cert.status !== "REVOKED" && (
                        <Form method="post" className="inline">
                          <input type="hidden" name="_action" value="revoke" />
                          <input type="hidden" name="certificateId" value={cert.id} />
                          <input type="hidden" name="reason" value="Administrative revocation" />
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                          >
                            Revoke
                          </Button>
                        </Form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
