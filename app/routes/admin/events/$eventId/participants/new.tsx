import { data, redirect, useActionData, useLoaderData, Form, Link } from "react-router";
import { useForm, getFormProps, getInputProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { z } from "zod/v4";
import crypto from "node:crypto";

export const handle = { breadcrumb: "Add Participant" };

import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import { getCachedSchema, parseFieldFormData } from "~/lib/fields.server";
import { getEffectiveFields } from "~/services/fields.server";
import { enterWorkflow } from "~/services/workflow-engine/entry.server";
import { FieldSection } from "~/components/fields/FieldSection";
import { FieldRenderer } from "~/components/fields/FieldRenderer";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import type { Route } from "./+types/new";

// ─── Fixed-field schema ─────────────────────────────────────────

const fixedFieldSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  organization: z.string().optional(),
  jobTitle: z.string().optional(),
  nationality: z.string().optional(),
  participantTypeId: z.string().optional(),
});

// ─── Types ──────────────────────────────────────────────────────

interface FormDefinition {
  settings?: { submitButtonText?: string };
  pages: {
    id: string;
    title: string;
    description?: string;
    order: number;
    sections: {
      id: string;
      title: string;
      description?: string;
      columns: number;
      order: number;
      fields: { id: string; fieldDefinitionId: string; order: number }[];
    }[];
  }[];
}

// ─── Loader ─────────────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "participant", "create");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;

  const [event, participantTypes, allFieldDefs, formTemplate] = await Promise.all([
    prisma.event.findFirst({
      where: { id: eventId, tenantId, deletedAt: null },
      select: { id: true, name: true },
    }),
    prisma.participantType.findMany({
      where: { eventId, tenantId },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    getEffectiveFields(tenantId, eventId, "Participant"),
    prisma.formTemplate.findFirst({
      where: { eventId, tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        definition: true,
        participantTypeId: true,
        participantType: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!event) {
    throw data({ error: "Event not found" }, { status: 404 });
  }

  // If a form template exists, load only the field definitions it references
  let templateFieldDefs: typeof allFieldDefs = [];
  let definition: FormDefinition | null = null;

  if (formTemplate) {
    definition = formTemplate.definition as FormDefinition | null;
    const fieldDefIds = new Set<string>();
    if (definition?.pages) {
      for (const page of definition.pages) {
        for (const section of page.sections ?? []) {
          for (const field of section.fields ?? []) {
            fieldDefIds.add(field.fieldDefinitionId);
          }
        }
      }
    }
    if (fieldDefIds.size > 0) {
      templateFieldDefs = await prisma.fieldDefinition.findMany({
        where: { id: { in: Array.from(fieldDefIds) }, tenantId },
        orderBy: { sortOrder: "asc" },
      });
    }
  }

  return {
    event,
    participantTypes,
    fieldDefs: formTemplate ? templateFieldDefs : allFieldDefs,
    formTemplate,
    definition,
  };
}

// ─── Action ─────────────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "participant", "create");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;
  const formData = await request.formData();

  // 1. Validate fixed fields
  const fixedResult = parseWithZod(formData, { schema: fixedFieldSchema });
  if (fixedResult.status !== "success") {
    return data({ result: fixedResult.reply() }, { status: 400 });
  }

  const fixedFields = fixedResult.value;

  // Resolve participantTypeId — from dropdown or hidden template field
  const participantTypeId =
    fixedFields.participantTypeId || (formData.get("_templateParticipantTypeId") as string) || null;

  if (!participantTypeId) {
    return data(
      {
        result: fixedResult.reply({
          formErrors: ["Participant type is required."],
        }),
      },
      { status: 400 },
    );
  }

  // Auto-assign the first published workflow (if one exists)
  const workflow = await prisma.workflow.findFirst({
    where: { eventId, tenantId, deletedAt: null, status: "PUBLISHED" },
    select: { id: true },
    orderBy: { name: "asc" },
  });

  // 2. Load field definitions and validate dynamic fields
  const fieldDefs = await getEffectiveFields(tenantId, eventId, "Participant");

  let extras: Record<string, unknown> = {};
  if (fieldDefs.length > 0) {
    const dynamicSchema = getCachedSchema(tenantId, eventId, fieldDefs);
    const dynamicData = parseFieldFormData(formData, fieldDefs);
    const dynamicResult = dynamicSchema.safeParse(dynamicData);

    if (!dynamicResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of dynamicResult.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = [];
        fieldErrors[path].push(issue.message);
      }
      return data({ result: fixedResult.reply(), fieldErrors }, { status: 400 });
    }
    extras = dynamicResult.data as Record<string, unknown>;
  }

  // 3. Generate registration code
  const registrationCode = `REG-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  // 4. Create participant
  try {
    const participant = await prisma.participant.create({
      data: {
        tenantId,
        eventId,
        participantTypeId,
        workflowId: workflow?.id ?? null,
        registrationCode,
        firstName: fixedFields.firstName,
        lastName: fixedFields.lastName,
        email: fixedFields.email || null,
        organization: fixedFields.organization || null,
        jobTitle: fixedFields.jobTitle || null,
        nationality: fixedFields.nationality || null,
        extras: extras as any,
        status: "PENDING",
      },
    });

    // 5. Enter workflow (best-effort, only if one exists)
    if (workflow) {
      try {
        await enterWorkflow(participant.id, workflow.id, user.id);
      } catch {
        // participant is still created
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entityType: "Participant",
        entityId: participant.id,
        description: `Registered participant ${fixedFields.firstName} ${fixedFields.lastName} (${registrationCode})`,
        metadata: { eventId, registrationCode, participantTypeId, workflowId: workflow?.id },
      },
    });

    return redirect(`/admin/events/${eventId}/participants/${participant.id}`);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return data(
        {
          result: fixedResult.reply({
            formErrors: [
              "A participant with this registration code already exists. Please try again.",
            ],
          }),
        },
        { status: 409 },
      );
    }
    throw error;
  }
}

// ─── Component ──────────────────────────────────────────────────

export default function NewParticipantPage() {
  const { event, participantTypes, fieldDefs, formTemplate, definition } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [form, fields] = useForm({
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: fixedFieldSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  const useTemplate = !!formTemplate;
  const showParticipantTypeSelect = !formTemplate?.participantTypeId;

  // Template mode: fieldDef lookup by id
  const fieldDefMap = new Map(fieldDefs.map((fd: any) => [fd.id, fd]));

  const visibleFieldDefs = fieldDefs;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Add Participant</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Register a new participant for {event.name}.
        </p>
      </div>

      <Form method="post" {...getFormProps(form)}>
        {/* Hidden: participant type from template */}
        {formTemplate?.participantTypeId && (
          <input
            type="hidden"
            name="_templateParticipantTypeId"
            value={formTemplate.participantTypeId}
          />
        )}

        {form.errors && form.errors.length > 0 && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
            {form.errors.map((error, i) => (
              <p key={i}>{error}</p>
            ))}
          </div>
        )}

        {/* Participant type selector (when not auto-assigned by template) */}
        {showParticipantTypeSelect && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Participant Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor={fields.participantTypeId.id}>
                Participant Type <span className="text-destructive">*</span>
              </Label>
              <NativeSelect
                {...getInputProps(fields.participantTypeId, { type: "text" })}
                key={fields.participantTypeId.key}
              >
                <NativeSelectOption value="">Select type...</NativeSelectOption>
                {participantTypes.map((pt: any) => (
                  <NativeSelectOption key={pt.id} value={pt.id}>
                    {pt.name} ({pt.code})
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {fields.participantTypeId.errors && (
                <p className="mt-1 text-sm text-destructive">
                  {fields.participantTypeId.errors[0]}
                </p>
              )}
              {participantTypes.length === 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  No participant types defined. Create them in the event settings first.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor={fields.firstName.id}>
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...getInputProps(fields.firstName, { type: "text" })}
                  key={fields.firstName.key}
                  placeholder="First name"
                />
                {fields.firstName.errors && (
                  <p className="mt-1 text-sm text-destructive">{fields.firstName.errors[0]}</p>
                )}
              </div>
              <div>
                <Label htmlFor={fields.lastName.id}>
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...getInputProps(fields.lastName, { type: "text" })}
                  key={fields.lastName.key}
                  placeholder="Last name"
                />
                {fields.lastName.errors && (
                  <p className="mt-1 text-sm text-destructive">{fields.lastName.errors[0]}</p>
                )}
              </div>
              <div>
                <Label htmlFor={fields.email.id}>Email</Label>
                <Input
                  {...getInputProps(fields.email, { type: "email" })}
                  key={fields.email.key}
                  placeholder="email@example.com"
                />
                {fields.email.errors && (
                  <p className="mt-1 text-sm text-destructive">{fields.email.errors[0]}</p>
                )}
              </div>
              <div>
                <Label htmlFor={fields.organization.id}>Organization</Label>
                <Input
                  {...getInputProps(fields.organization, { type: "text" })}
                  key={fields.organization.key}
                  placeholder="Organization"
                />
              </div>
              <div>
                <Label htmlFor={fields.jobTitle.id}>Job Title</Label>
                <Input
                  {...getInputProps(fields.jobTitle, { type: "text" })}
                  key={fields.jobTitle.key}
                  placeholder="Job title"
                />
              </div>
              <div>
                <Label htmlFor={fields.nationality.id}>Nationality</Label>
                <Input
                  {...getInputProps(fields.nationality, { type: "text" })}
                  key={fields.nationality.key}
                  placeholder="Nationality"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template layout: render pages → sections → fields */}
        {useTemplate &&
          definition?.pages?.map((page: any) => (
            <div key={page.id} className="space-y-6 mb-6">
              {(definition.pages?.length ?? 0) > 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{page.title}</h3>
                  {page.description && (
                    <p className="text-sm text-muted-foreground">{page.description}</p>
                  )}
                  <Separator className="mt-2" />
                </div>
              )}

              {(page.sections ?? [])
                .sort((a: any, b: any) => a.order - b.order)
                .map((section: any) => {
                  const sectionFields = (section.fields ?? [])
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((placement: any) => fieldDefMap.get(placement.fieldDefinitionId))
                    .filter(Boolean);

                  if (sectionFields.length === 0) return null;

                  const fieldset = (form as any).getFieldset();

                  return (
                    <Card key={section.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{section.title}</CardTitle>
                        {section.description && (
                          <CardDescription>{section.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div
                          className={`grid gap-4 grid-cols-1 ${
                            section.columns >= 2 ? "md:grid-cols-2" : ""
                          } ${section.columns >= 3 ? "lg:grid-cols-3" : ""} ${
                            section.columns >= 4 ? "xl:grid-cols-4" : ""
                          }`}
                        >
                          {sectionFields.map((fd: any) => {
                            const meta = fieldset[fd.name];
                            if (!meta) return null;
                            return (
                              <div key={fd.id}>
                                <FieldRenderer fieldDef={fd} meta={meta} />
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          ))}

        {/* Auto-generated fields (no template) */}
        {!useTemplate && visibleFieldDefs.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldSection fieldDefs={visibleFieldDefs} form={form as any} columns={2} />
            </CardContent>
          </Card>
        )}

        {/* Dynamic field errors */}
        {(actionData as any)?.fieldErrors && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
            {Object.entries((actionData as any).fieldErrors).map(([field, errors]) => (
              <p key={field}>
                {field}: {(errors as string[]).join(", ")}
              </p>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit">
            {useTemplate && (definition as any)?.settings?.submitButtonText
              ? (definition as any).settings.submitButtonText
              : "Register Participant"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to={`/admin/events/${event.id}/participants`}>Cancel</Link>
          </Button>
        </div>
      </Form>
    </div>
  );
}
