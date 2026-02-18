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

export const handle = { breadcrumb: "Compliance" };

// ─── Loader ──────────────────────────────────────────────

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { requirePermission } = await import("~/lib/require-auth.server");
  const { isFeatureEnabled, FEATURE_FLAG_KEYS } = await import("~/lib/feature-flags.server");
  const {
    listDocumentRequirements,
    getComplianceDashboard,
    getExpiringDocuments,
    listRetentionPolicies,
    getRetentionReport,
  } = await import("~/services/compliance.server");

  const { user } = await requirePermission(request, "compliance", "manage");
  const tenantId = user.tenantId;
  const eventId = params.eventId!;

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.COMPLIANCE_DASHBOARD);
  if (!enabled) throw data("Feature not enabled", { status: 404 });

  const [requirements, dashboard, expiring, policies, retentionReport] = await Promise.all([
    listDocumentRequirements(eventId, tenantId),
    getComplianceDashboard(eventId, tenantId),
    getExpiringDocuments(eventId, tenantId, 30),
    listRetentionPolicies(tenantId),
    getRetentionReport(tenantId),
  ]);

  return {
    requirements: requirements.map((r: any) => ({
      ...r,
      createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
      updatedAt: r.updatedAt?.toISOString?.() ?? r.updatedAt,
      documentCount: r.documents?.length ?? 0,
      validCount: r.documents?.filter((d: any) => d.status === "VALID").length ?? 0,
    })),
    dashboard,
    expiring: expiring.map((d: any) => ({
      ...d,
      expiresAt: d.expiresAt?.toISOString?.() ?? d.expiresAt,
      uploadedAt: d.uploadedAt?.toISOString?.() ?? d.uploadedAt,
    })),
    policies: policies.map((p: any) => ({
      ...p,
      lastRunAt: p.lastRunAt?.toISOString?.() ?? null,
      createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
    })),
    retentionReport,
    eventId,
  };
}

// ─── Action ──────────────────────────────────────────────

export async function action({ request, params }: ActionFunctionArgs) {
  const { requirePermission } = await import("~/lib/require-auth.server");
  const { user } = await requirePermission(request, "compliance", "manage");
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
    if (_action === "create_requirement") {
      const { createDocumentRequirementSchema } = await import("~/lib/schemas/compliance");
      const { createDocumentRequirement } = await import("~/services/compliance.server");

      const parsed = createDocumentRequirementSchema.parse({
        eventId,
        name: formData.get("name"),
        description: formData.get("description"),
        documentType: formData.get("documentType"),
        isRequired: formData.get("isRequired"),
        participantTypes: formData.get("participantTypes"),
        validityDays: formData.get("validityDays"),
      });

      await createDocumentRequirement(parsed, ctx);
      return { success: true, message: "Document requirement created" };
    }

    if (_action === "submit_document") {
      const { submitDocumentSchema } = await import("~/lib/schemas/compliance");
      const { submitDocument } = await import("~/services/compliance.server");

      const parsed = submitDocumentSchema.parse({
        requirementId: formData.get("requirementId"),
        participantId: formData.get("participantId"),
        documentNumber: formData.get("documentNumber"),
        expiresAt: formData.get("expiresAt"),
        notes: formData.get("notes"),
      });

      await submitDocument(parsed, ctx);
      return { success: true, message: "Document submitted" };
    }

    if (_action === "verify_document") {
      const { verifyDocumentSchema } = await import("~/lib/schemas/compliance");
      const { verifyDocument } = await import("~/services/compliance.server");

      const documentId = formData.get("documentId") as string;
      const parsed = verifyDocumentSchema.parse({
        status: formData.get("status"),
        notes: formData.get("notes"),
      });

      await verifyDocument(documentId, parsed, ctx);
      return { success: true, message: `Document marked as ${parsed.status}` };
    }

    if (_action === "create_retention_policy") {
      const { createRetentionPolicySchema } = await import("~/lib/schemas/compliance");
      const { createRetentionPolicy } = await import("~/services/compliance.server");

      const parsed = createRetentionPolicySchema.parse({
        entityType: formData.get("entityType"),
        retentionDays: formData.get("retentionDays"),
        action: formData.get("action"),
      });

      await createRetentionPolicy(parsed, ctx);
      return { success: true, message: "Retention policy created" };
    }

    if (_action === "execute_retention") {
      const { executeRetentionPolicy } = await import("~/services/compliance.server");
      const policyId = formData.get("policyId") as string;

      const result = await executeRetentionPolicy(policyId, ctx);
      return {
        success: true,
        message: `Retention executed: ${result.action} ${result.affected} records`,
      };
    }

    return { error: "Unknown action" };
  } catch (err: any) {
    if (err.name === "ComplianceError") {
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
  VALID: "bg-green-100 text-green-800",
  EXPIRING_SOON: "bg-yellow-100 text-yellow-800",
  EXPIRED: "bg-red-100 text-red-800",
  NOT_PROVIDED: "bg-gray-100 text-gray-800",
};

export default function CompliancePage() {
  const { requirements, dashboard, expiring, policies, retentionReport, eventId } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [showPolicyForm, setShowPolicyForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Compliance</h2>
          <p className="text-muted-foreground">
            Track document requirements, verify submissions, and manage data retention
          </p>
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

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Compliance Rate</p>
          <p className="text-2xl font-bold">{dashboard.complianceRate}%</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Requirements</p>
          <p className="text-2xl font-bold">{dashboard.totalRequirements}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Valid</p>
          <p className="text-2xl font-bold text-green-600">{dashboard.valid}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Expired</p>
          <p className="text-2xl font-bold text-red-600">{dashboard.expired}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Not Provided</p>
          <p className="text-2xl font-bold text-gray-600">{dashboard.notProvided}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Expiring (30d)</p>
          <p className="text-2xl font-bold text-yellow-600">{dashboard.expiringWithin30Days}</p>
        </div>
      </div>

      {/* Expiring Documents Alert */}
      {expiring.length > 0 && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <h3 className="mb-2 font-semibold text-yellow-800">Documents Expiring Within 30 Days</h3>
          <div className="space-y-1 text-sm">
            {expiring.slice(0, 10).map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between">
                <span>
                  {doc.participant?.firstName} {doc.participant?.lastName} — {doc.requirement?.name}
                </span>
                <span className="text-yellow-700">
                  Expires {new Date(doc.expiresAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            {expiring.length > 10 && (
              <p className="text-muted-foreground">...and {expiring.length - 10} more</p>
            )}
          </div>
        </div>
      )}

      {/* Document Requirements */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Document Requirements</h3>
          <Button size="sm" onClick={() => setShowRequirementForm(!showRequirementForm)}>
            {showRequirementForm ? "Cancel" : "Add Requirement"}
          </Button>
        </div>

        {showRequirementForm && (
          <Form method="post" className="rounded-lg border p-4 space-y-4">
            <input type="hidden" name="_action" value="create_requirement" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="req-name">Name</Label>
                <Input id="req-name" name="name" required placeholder="e.g., Passport" />
              </div>
              <div>
                <Label htmlFor="req-type">Document Type</Label>
                <Input id="req-type" name="documentType" required placeholder="e.g., PASSPORT" />
              </div>
              <div>
                <Label htmlFor="req-desc">Description</Label>
                <Textarea
                  id="req-desc"
                  name="description"
                  placeholder="What this document is for..."
                />
              </div>
              <div>
                <Label htmlFor="req-types">Participant Types (comma-separated)</Label>
                <Input id="req-types" name="participantTypes" placeholder="e.g., DELEGATE,VIP" />
              </div>
              <div>
                <Label htmlFor="req-validity">Validity Days</Label>
                <Input
                  id="req-validity"
                  name="validityDays"
                  type="number"
                  placeholder="e.g., 365"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="req-required" name="isRequired" defaultChecked />
                <Label htmlFor="req-required">Required</Label>
              </div>
            </div>
            <Button type="submit">Create Requirement</Button>
          </Form>
        )}

        {requirements.length === 0 ? (
          <p className="text-muted-foreground text-sm">No document requirements configured.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Required</th>
                  <th className="pb-2 font-medium">Participant Types</th>
                  <th className="pb-2 font-medium">Validity</th>
                  <th className="pb-2 font-medium">Submitted</th>
                  <th className="pb-2 font-medium">Valid</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((req: any) => (
                  <tr key={req.id} className="border-b">
                    <td className="py-2 font-medium">{req.name}</td>
                    <td className="py-2">{req.documentType}</td>
                    <td className="py-2">
                      <Badge
                        className={
                          req.isRequired ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                        }
                      >
                        {req.isRequired ? "Required" : "Optional"}
                      </Badge>
                    </td>
                    <td className="py-2">
                      {req.participantTypes?.length > 0 ? req.participantTypes.join(", ") : "All"}
                    </td>
                    <td className="py-2">{req.validityDays ? `${req.validityDays} days` : "—"}</td>
                    <td className="py-2">{req.documentCount}</td>
                    <td className="py-2 text-green-600">{req.validCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Document */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Submit Document</h3>
          <Button size="sm" onClick={() => setShowSubmitForm(!showSubmitForm)}>
            {showSubmitForm ? "Cancel" : "Submit Document"}
          </Button>
        </div>

        {showSubmitForm && (
          <Form method="post" className="rounded-lg border p-4 space-y-4">
            <input type="hidden" name="_action" value="submit_document" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="sub-req">Requirement</Label>
                <NativeSelect id="sub-req" name="requirementId" required>
                  <NativeSelectOption value="">Select requirement...</NativeSelectOption>
                  {requirements.map((r: any) => (
                    <NativeSelectOption key={r.id} value={r.id}>
                      {r.name} ({r.documentType})
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <Label htmlFor="sub-part">Participant ID</Label>
                <Input id="sub-part" name="participantId" required placeholder="Participant CUID" />
              </div>
              <div>
                <Label htmlFor="sub-num">Document Number</Label>
                <Input id="sub-num" name="documentNumber" placeholder="e.g., AB123456" />
              </div>
              <div>
                <Label htmlFor="sub-exp">Expiry Date</Label>
                <Input id="sub-exp" name="expiresAt" type="date" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="sub-notes">Notes</Label>
                <Textarea id="sub-notes" name="notes" placeholder="Additional notes..." />
              </div>
            </div>
            <Button type="submit">Submit Document</Button>
          </Form>
        )}
      </div>

      {/* Data Retention Policies */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Data Retention Policies</h3>
          <Button size="sm" onClick={() => setShowPolicyForm(!showPolicyForm)}>
            {showPolicyForm ? "Cancel" : "Add Policy"}
          </Button>
        </div>

        {showPolicyForm && (
          <Form method="post" className="rounded-lg border p-4 space-y-4">
            <input type="hidden" name="_action" value="create_retention_policy" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="pol-entity">Entity Type</Label>
                <NativeSelect id="pol-entity" name="entityType" required>
                  <NativeSelectOption value="">Select...</NativeSelectOption>
                  <NativeSelectOption value="ParticipantDocument">
                    Participant Documents
                  </NativeSelectOption>
                  <NativeSelectOption value="Participant">Participants</NativeSelectOption>
                  <NativeSelectOption value="AuditLog">Audit Logs</NativeSelectOption>
                </NativeSelect>
              </div>
              <div>
                <Label htmlFor="pol-days">Retention Days</Label>
                <Input
                  id="pol-days"
                  name="retentionDays"
                  type="number"
                  required
                  min={1}
                  placeholder="e.g., 365"
                />
              </div>
              <div>
                <Label htmlFor="pol-action">Action</Label>
                <NativeSelect id="pol-action" name="action" required>
                  <NativeSelectOption value="RETAIN">Retain</NativeSelectOption>
                  <NativeSelectOption value="ANONYMIZE">Anonymize</NativeSelectOption>
                  <NativeSelectOption value="DELETE">Delete</NativeSelectOption>
                </NativeSelect>
              </div>
            </div>
            <Button type="submit">Create Policy</Button>
          </Form>
        )}

        {policies.length === 0 ? (
          <p className="text-muted-foreground text-sm">No retention policies configured.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-medium">Entity Type</th>
                  <th className="pb-2 font-medium">Retention</th>
                  <th className="pb-2 font-medium">Action</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Last Run</th>
                  <th className="pb-2 font-medium">Records Due</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy: any) => {
                  const report = retentionReport.find((r: any) => r.policyId === policy.id);
                  return (
                    <tr key={policy.id} className="border-b">
                      <td className="py-2 font-medium">{policy.entityType}</td>
                      <td className="py-2">{policy.retentionDays} days</td>
                      <td className="py-2">
                        <Badge
                          className={
                            policy.action === "DELETE"
                              ? "bg-red-100 text-red-800"
                              : policy.action === "ANONYMIZE"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }
                        >
                          {policy.action}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Badge
                          className={
                            policy.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {policy.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-2">
                        {policy.lastRunAt ? new Date(policy.lastRunAt).toLocaleString() : "Never"}
                      </td>
                      <td className="py-2">{report?.recordsAffected ?? "—"}</td>
                      <td className="py-2">
                        {policy.isActive && (
                          <Form method="post" className="inline">
                            <input type="hidden" name="_action" value="execute_retention" />
                            <input type="hidden" name="policyId" value={policy.id} />
                            <Button type="submit" size="sm" variant="outline">
                              Execute
                            </Button>
                          </Form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Retention Report */}
      {retentionReport.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-lg font-semibold">Retention Report</h3>
          <div className="space-y-2 text-sm">
            {retentionReport.map((entry: any) => (
              <div
                key={entry.policyId}
                className="flex items-center justify-between border-b py-2 last:border-0"
              >
                <div>
                  <span className="font-medium">{entry.entityType}</span>
                  <span className="text-muted-foreground ml-2">
                    ({entry.retentionDays} days, {entry.action})
                  </span>
                </div>
                <div>
                  <Badge
                    className={
                      entry.recordsAffected > 0
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }
                  >
                    {entry.recordsAffected} records due
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
