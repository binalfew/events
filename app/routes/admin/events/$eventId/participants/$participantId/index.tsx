import { data, useLoaderData, useActionData, useFetcher, Link } from "react-router";
import { useState } from "react";

export const handle = { breadcrumb: "Detail" };

import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import { getEffectiveFields } from "~/services/fields.server";
import { processWorkflowAction } from "~/services/workflow-engine/navigation.server";
import { WorkflowError } from "~/services/workflow-engine/serializer.server";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import type { Route } from "./+types/index";

// ─── Status Badge Config ─────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  PRINTED: "bg-purple-100 text-purple-800",
};

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "participant", "read");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const { eventId, participantId } = params;

  const [participant, fieldDefs] = await Promise.all([
    prisma.participant.findFirst({
      where: { id: participantId, eventId, tenantId, deletedAt: null },
      include: {
        participantType: { select: { id: true, name: true, code: true } },
        workflow: { select: { id: true, name: true } },
        approvals: {
          select: {
            id: true,
            action: true,
            remarks: true,
            createdAt: true,
            stepId: true,
            user: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    }),
    getEffectiveFields(tenantId, eventId, "Participant"),
  ]);

  if (!participant) {
    throw data({ error: "Participant not found" }, { status: 404 });
  }

  // Get current step name
  let currentStepName: string | null = null;
  if (participant.currentStepId && participant.workflowVersionId) {
    const step = await prisma.step.findUnique({
      where: { id: participant.currentStepId },
      select: { name: true, stepType: true },
    });
    currentStepName = step?.name ?? null;
  }

  return {
    participant,
    fieldDefs,
    currentStepName,
    eventId,
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "participant", "approve");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const _action = formData.get("_action") as string;
  const comment = (formData.get("comment") as string) || undefined;

  if (!["APPROVE", "REJECT", "BYPASS", "PRINT"].includes(_action)) {
    return data({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const result = await processWorkflowAction(
      params.participantId,
      user.id,
      _action as any,
      comment,
    );
    return data({ success: true, ...result });
  } catch (error) {
    if (error instanceof WorkflowError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

// ─── Component ────────────────────────────────────────────

export default function ParticipantDetailPage() {
  const { participant, fieldDefs, currentStepName, eventId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();
  const [comment, setComment] = useState("");

  const extras = (participant.extras ?? {}) as Record<string, unknown>;
  const isSubmitting = fetcher.state !== "idle";

  // Filter field defs for this participant's type
  const visibleFieldDefs = fieldDefs.filter(
    (fd: any) => !fd.participantTypeId || fd.participantTypeId === participant.participantType?.id,
  );

  function submitAction(action: string) {
    fetcher.submit({ _action: action, comment }, { method: "POST" });
    setComment("");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {participant.firstName} {participant.lastName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{participant.registrationCode}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[participant.status] ?? "bg-gray-100 text-gray-800"}`}
          >
            {participant.status}
          </span>
          <Button variant="outline" asChild>
            <Link to="edit">Edit</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/admin/events/${eventId}/participants`}>Back to List</Link>
          </Button>
        </div>
      </div>

      {/* Action feedback */}
      {actionData && "error" in actionData && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {(actionData as any).error}
        </div>
      )}
      {actionData && "success" in actionData && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Action completed successfully.
        </div>
      )}
      {fetcher.data && typeof fetcher.data === "object" && "error" in fetcher.data && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {(fetcher.data as any).error}
        </div>
      )}
      {fetcher.data && typeof fetcher.data === "object" && "success" in fetcher.data && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Action completed successfully. Reload to see updated status.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: participant data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fixed Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField label="First Name" value={participant.firstName} />
                <DetailField label="Last Name" value={participant.lastName} />
                <DetailField label="Email" value={participant.email} />
                <DetailField label="Organization" value={participant.organization} />
                <DetailField label="Job Title" value={participant.jobTitle} />
                <DetailField label="Nationality" value={participant.nationality} />
                <DetailField label="Participant Type" value={participant.participantType?.name} />
                <DetailField label="Registration Code" value={participant.registrationCode} />
              </dl>
            </CardContent>
          </Card>

          {/* Dynamic Fields */}
          {visibleFieldDefs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {visibleFieldDefs.map((fd: any) => {
                    const value = extras[fd.name];
                    return (
                      <DetailField
                        key={fd.id}
                        label={fd.label}
                        value={formatFieldValue(fd, value)}
                      />
                    );
                  })}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: workflow & actions */}
        <div className="space-y-6">
          {/* Workflow Status */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailField label="Workflow" value={participant.workflow?.name} />
              <DetailField label="Current Step" value={currentStepName} />
              <DetailField label="Status" value={participant.status} />
              <DetailField
                label="Created"
                value={new Date(participant.createdAt).toLocaleString()}
              />
              <DetailField
                label="Updated"
                value={new Date(participant.updatedAt).toLocaleString()}
              />
            </CardContent>
          </Card>

          {/* Workflow Actions */}
          {participant.status !== "APPROVED" && participant.status !== "CANCELLED" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="comment">Comment (optional)</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Add a comment..."
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => submitAction("APPROVE")} disabled={isSubmitting}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => submitAction("REJECT")}
                    disabled={isSubmitting}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => submitAction("BYPASS")}
                    disabled={isSubmitting}
                  >
                    Bypass
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approval History */}
          {participant.approvals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Approval History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {participant.approvals.map((approval: any) => (
                    <div key={approval.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{approval.action}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(approval.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        by {approval.user?.name ?? approval.user?.email ?? "Unknown"}
                      </p>
                      {approval.remarks && (
                        <p className="mt-1 italic text-muted-foreground">"{approval.remarks}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────

function DetailField({ label, value }: { label: string; value: unknown }) {
  const display = value === null || value === undefined || value === "" ? "—" : String(value);

  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{display}</dd>
    </div>
  );
}

function formatFieldValue(fieldDef: any, value: unknown): string {
  if (value === null || value === undefined) return "—";

  switch (fieldDef.dataType) {
    case "BOOLEAN":
      return value ? "Yes" : "No";
    case "MULTI_ENUM": {
      if (Array.isArray(value)) {
        const config = fieldDef.config as any;
        const options = config?.options as Array<{ value: string; label: string }> | undefined;
        if (options) {
          const labelMap = new Map(options.map((o) => [o.value, o.label]));
          return value.map((v) => labelMap.get(String(v)) ?? v).join(", ");
        }
        return value.join(", ");
      }
      return String(value);
    }
    case "ENUM": {
      const config = fieldDef.config as any;
      const options = config?.options as Array<{ value: string; label: string }> | undefined;
      if (options) {
        const match = options.find((o) => o.value === String(value));
        if (match) return match.label;
      }
      return String(value);
    }
    case "DATE":
      return new Date(String(value)).toLocaleDateString();
    case "DATETIME":
      return new Date(String(value)).toLocaleString();
    default:
      return String(value);
  }
}
