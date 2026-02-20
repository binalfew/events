import { useState } from "react";
import { data, useLoaderData, useActionData, Form, useNavigation } from "react-router";
import { useForm, getFormProps, getInputProps, getTextareaProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { z } from "zod/v4";
import { Pencil, Trash2, Plus, X } from "lucide-react";

import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ConformField } from "~/components/ui/conform-field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import type { Route } from "./+types/participant-types";

export const handle = { breadcrumb: "Participant Types" };

// ─── Schema ──────────────────────────────────────────────────────────
const participantTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z
    .string()
    .min(1, "Code is required")
    .max(20)
    .regex(/^[A-Z0-9_]+$/, "Uppercase letters, numbers, underscores only"),
  description: z.string().max(500).optional().default(""),
});

// ─── Loader ──────────────────────────────────────────────────────────
export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "event", "read");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const event = await prisma.event.findFirst({
    where: { id: params.eventId, tenantId, deletedAt: null },
  });
  if (!event) {
    throw data({ error: "Event not found" }, { status: 404 });
  }

  const participantTypes = await prisma.participantType.findMany({
    where: { tenantId, eventId: params.eventId },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          participants: true,
          formTemplates: true,
        },
      },
    },
  });

  return { event, participantTypes };
}

// ─── Action ──────────────────────────────────────────────────────────
export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "event", "update");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  // ── Delete ──
  if (intent === "delete") {
    const typeId = formData.get("typeId") as string;
    if (!typeId) {
      return data({ intent: "delete", error: "Missing type ID" }, { status: 400 });
    }

    const existing = await prisma.participantType.findFirst({
      where: { id: typeId, tenantId, eventId: params.eventId },
      include: { _count: { select: { participants: true } } },
    });
    if (!existing) {
      return data({ intent: "delete", error: "Participant type not found" }, { status: 404 });
    }
    if (existing._count.participants > 0) {
      return data(
        {
          intent: "delete",
          error: `Cannot delete type with ${existing._count.participants} participant(s). Remove participants first.`,
        },
        { status: 409 },
      );
    }

    await prisma.participantType.delete({ where: { id: typeId } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "DELETE",
        entityType: "ParticipantType",
        entityId: typeId,
        description: `Deleted participant type "${existing.name}" (${existing.code})`,
        metadata: { name: existing.name, code: existing.code },
      },
    });

    return { intent: "delete", ok: true };
  }

  // ── Create / Update ──
  const submission = parseWithZod(formData, { schema: participantTypeSchema });
  if (submission.status !== "success") {
    return data({ intent: String(intent), result: submission.reply() }, { status: 400 });
  }

  const { name, code, description } = submission.value;

  if (intent === "update") {
    const typeId = formData.get("typeId") as string;
    if (!typeId) {
      return data(
        {
          intent: "update",
          result: submission.reply({ formErrors: ["Missing type ID"] }),
        },
        { status: 400 },
      );
    }

    try {
      const updated = await prisma.participantType.update({
        where: { id: typeId },
        data: { name, code, description: description ?? "" },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE",
          entityType: "ParticipantType",
          entityId: updated.id,
          description: `Updated participant type "${updated.name}" (${updated.code})`,
          metadata: { name: updated.name, code: updated.code },
        },
      });

      return { intent: "update", ok: true };
    } catch (error) {
      if (error instanceof Error && "code" in error && (error as any).code === "P2002") {
        return data(
          {
            intent: "update",
            result: submission.reply({
              formErrors: ["A type with this code already exists for this event"],
            }),
          },
          { status: 409 },
        );
      }
      throw error;
    }
  }

  // ── Create (default) ──
  try {
    const created = await prisma.participantType.create({
      data: {
        name,
        code,
        description: description ?? "",
        tenantId,
        eventId: params.eventId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entityType: "ParticipantType",
        entityId: created.id,
        description: `Created participant type "${created.name}" (${created.code})`,
        metadata: { name: created.name, code: created.code },
      },
    });

    return { intent: "create", ok: true };
  } catch (error) {
    if (error instanceof Error && "code" in error && (error as any).code === "P2002") {
      return data(
        {
          intent: "create",
          result: submission.reply({
            formErrors: ["A type with this code already exists for this event"],
          }),
        },
        { status: 409 },
      );
    }
    throw error;
  }
}

// ─── Component ───────────────────────────────────────────────────────
export default function ParticipantTypesPage() {
  const { event, participantTypes } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Reset UI state after successful action
  const lastIntent = actionData && "ok" in actionData ? actionData.intent : null;
  if (lastIntent === "create" && showCreateForm) {
    // Will be handled by key reset below
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Participant Types</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage participant types for {event.name}.
          </p>
        </div>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Type
          </Button>
        )}
      </div>

      {/* ── Create Form ── */}
      {showCreateForm && (
        <CreateTypeForm
          actionData={
            actionData && "result" in actionData && actionData.intent === "create"
              ? actionData
              : undefined
          }
          isSubmitting={isSubmitting}
          onCancel={() => setShowCreateForm(false)}
          onSuccess={lastIntent === "create"}
        />
      )}

      {/* ── Table ── */}
      <Card>
        <CardHeader>
          <CardTitle>Types ({participantTypes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {participantTypes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No participant types yet. Add one to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Participants</TableHead>
                  <TableHead className="text-center">Fields</TableHead>
                  <TableHead className="text-center">Forms</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participantTypes.map((pt) =>
                  editingId === pt.id ? (
                    <EditTypeRow
                      key={pt.id}
                      type={pt}
                      actionData={
                        actionData && "result" in actionData && actionData.intent === "update"
                          ? actionData
                          : undefined
                      }
                      isSubmitting={isSubmitting}
                      onCancel={() => setEditingId(null)}
                      onSuccess={lastIntent === "update"}
                    />
                  ) : (
                    <TypeRow
                      key={pt.id}
                      type={pt}
                      onEdit={() => setEditingId(pt.id)}
                      isSubmitting={isSubmitting}
                    />
                  ),
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Create Form ─────────────────────────────────────────────────────
function CreateTypeForm({
  actionData,
  isSubmitting,
  onCancel,
  onSuccess,
}: {
  actionData?: { result: any };
  isSubmitting: boolean;
  onCancel: () => void;
  onSuccess: boolean;
}) {
  const [form, fields] = useForm({
    id: "create-type",
    lastResult: onSuccess ? undefined : actionData?.result,
    defaultValue: { name: "", code: "", description: "" },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: participantTypeSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Participant Type</CardTitle>
      </CardHeader>
      <CardContent>
        <Form method="post" {...getFormProps(form)} className="space-y-4">
          <input type="hidden" name="intent" value="create" />

          {form.errors && form.errors.length > 0 && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {form.errors.map((error, i) => (
                <p key={i}>{error}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ConformField
              fieldId={fields.name.id}
              label="Name"
              required
              errors={fields.name.errors}
            >
              <Input
                {...getInputProps(fields.name, { type: "text" })}
                key={fields.name.key}
                placeholder="e.g. Delegate"
              />
            </ConformField>

            <ConformField
              fieldId={fields.code.id}
              label="Code"
              required
              description="Uppercase letters, numbers, underscores only"
              errors={fields.code.errors}
            >
              <Input
                {...getInputProps(fields.code, { type: "text" })}
                key={fields.code.key}
                placeholder="e.g. DEL"
              />
            </ConformField>
          </div>

          <ConformField
            fieldId={fields.description.id}
            label="Description"
            errors={fields.description.errors}
          >
            <Textarea
              {...getTextareaProps(fields.description)}
              key={fields.description.key}
              rows={2}
              placeholder="Optional description"
            />
          </ConformField>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Type"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}

// ─── Type Row (read-only) ────────────────────────────────────────────
function TypeRow({
  type,
  onEdit,
  isSubmitting,
}: {
  type: any;
  onEdit: () => void;
  isSubmitting: boolean;
}) {
  const hasParticipants = type._count.participants > 0;

  return (
    <TableRow>
      <TableCell className="font-medium">{type.name}</TableCell>
      <TableCell>
        <Badge variant="secondary">{type.code}</Badge>
      </TableCell>
      <TableCell className="max-w-[200px] truncate text-muted-foreground">
        {type.description || "—"}
      </TableCell>
      <TableCell className="text-center">{type._count.participants}</TableCell>
      <TableCell className="text-center">{type._count.fieldDefinitions}</TableCell>
      <TableCell className="text-center">{type._count.formTemplates}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Form method="post" className="inline">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="typeId" value={type.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      disabled={hasParticipants || isSubmitting}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Form>
                </span>
              </TooltipTrigger>
              {hasParticipants && (
                <TooltipContent>
                  Cannot delete — {type._count.participants} participant(s) use this type
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Edit Row ────────────────────────────────────────────────────────
function EditTypeRow({
  type,
  actionData,
  isSubmitting,
  onCancel,
  onSuccess,
}: {
  type: any;
  actionData?: { result: any };
  isSubmitting: boolean;
  onCancel: () => void;
  onSuccess: boolean;
}) {
  const [form, fields] = useForm({
    id: `edit-type-${type.id}`,
    lastResult: onSuccess ? undefined : actionData?.result,
    defaultValue: {
      name: type.name,
      code: type.code,
      description: type.description ?? "",
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: participantTypeSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <TableRow>
      <TableCell colSpan={7}>
        <Form method="post" {...getFormProps(form)} className="space-y-3 py-2">
          <input type="hidden" name="intent" value="update" />
          <input type="hidden" name="typeId" value={type.id} />

          {form.errors && form.errors.length > 0 && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {form.errors.map((error, i) => (
                <p key={i}>{error}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ConformField
              fieldId={fields.name.id}
              label="Name"
              required
              errors={fields.name.errors}
            >
              <Input {...getInputProps(fields.name, { type: "text" })} key={fields.name.key} />
            </ConformField>

            <ConformField
              fieldId={fields.code.id}
              label="Code"
              required
              errors={fields.code.errors}
            >
              <Input {...getInputProps(fields.code, { type: "text" })} key={fields.code.key} />
            </ConformField>

            <ConformField
              fieldId={fields.description.id}
              label="Description"
              errors={fields.description.errors}
            >
              <Input
                {...getInputProps(fields.description, { type: "text" })}
                key={fields.description.key}
              />
            </ConformField>
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              <X className="mr-1 h-3 w-3" />
              Cancel
            </Button>
          </div>
        </Form>
      </TableCell>
    </TableRow>
  );
}
