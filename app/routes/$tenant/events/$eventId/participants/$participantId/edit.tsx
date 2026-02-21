import { data, redirect, useActionData, useLoaderData, Form, Link } from "react-router";
import { useForm, getFormProps, getInputProps } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { z } from "zod/v4";

export const handle = { breadcrumb: "Edit" };

import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import { getCachedSchema, parseFieldFormData } from "~/lib/fields.server";
import { getEffectiveFields } from "~/services/fields.server";
import { FieldSection } from "~/components/fields/FieldSection";
import { FieldRenderer } from "~/components/fields/FieldRenderer";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { useBasePrefix } from "~/hooks/use-base-prefix";
import type { Route } from "./+types/edit";

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
  const { user } = await requirePermission(request, "participant", "update");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const { eventId, participantId } = params;

  const [participant, participantTypes, allFieldDefs, formTemplate] = await Promise.all([
    prisma.participant.findFirst({
      where: { id: participantId, eventId, tenantId, deletedAt: null },
      include: {
        participantType: { select: { id: true, name: true, code: true } },
      },
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

  if (!participant) {
    throw data({ error: "Participant not found" }, { status: 404 });
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
    participant,
    participantTypes,
    fieldDefs: formTemplate ? templateFieldDefs : allFieldDefs,
    formTemplate,
    definition,
    eventId,
  };
}

// ─── Action ─────────────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "participant", "update");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const { eventId, participantId } = params;
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

  // 3. Update participant
  await prisma.participant.update({
    where: { id: participantId },
    data: {
      firstName: fixedFields.firstName,
      lastName: fixedFields.lastName,
      email: fixedFields.email || null,
      organization: fixedFields.organization || null,
      jobTitle: fixedFields.jobTitle || null,
      nationality: fixedFields.nationality || null,
      participantTypeId,
      extras: extras as any,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "UPDATE",
      entityType: "Participant",
      entityId: participantId,
      description: `Updated participant ${fixedFields.firstName} ${fixedFields.lastName}`,
      metadata: { eventId, participantTypeId },
    },
  });

  return redirect(`/${params.tenant}/events/${eventId}/participants/${participantId}`);
}

// ─── Component ──────────────────────────────────────────────────

export default function EditParticipantPage() {
  const { participant, participantTypes, fieldDefs, formTemplate, definition, eventId } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const basePrefix = useBasePrefix();
  const extras = (participant.extras ?? {}) as Record<string, unknown>;

  // Build default values for dynamic fields
  const dynamicDefaults: Record<string, unknown> = {};
  for (const fd of fieldDefs) {
    if (extras[fd.name] !== undefined) {
      dynamicDefaults[fd.name] = extras[fd.name];
    }
  }

  const [form, fields] = useForm({
    lastResult: actionData?.result,
    defaultValue: {
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email ?? "",
      organization: participant.organization ?? "",
      jobTitle: participant.jobTitle ?? "",
      nationality: participant.nationality ?? "",
      participantTypeId: participant.participantTypeId,
      ...dynamicDefaults,
    },
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
        <h2 className="text-2xl font-bold text-foreground">Edit Participant</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update details for {participant.firstName} {participant.lastName}.
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
                />
                {fields.lastName.errors && (
                  <p className="mt-1 text-sm text-destructive">{fields.lastName.errors[0]}</p>
                )}
              </div>
              <div>
                <Label htmlFor={fields.email.id}>Email</Label>
                <Input {...getInputProps(fields.email, { type: "email" })} key={fields.email.key} />
                {fields.email.errors && (
                  <p className="mt-1 text-sm text-destructive">{fields.email.errors[0]}</p>
                )}
              </div>
              <div>
                <Label htmlFor={fields.organization.id}>Organization</Label>
                <Input
                  {...getInputProps(fields.organization, { type: "text" })}
                  key={fields.organization.key}
                />
              </div>
              <div>
                <Label htmlFor={fields.jobTitle.id}>Job Title</Label>
                <Input
                  {...getInputProps(fields.jobTitle, { type: "text" })}
                  key={fields.jobTitle.key}
                />
              </div>
              <div>
                <Label htmlFor={fields.nationality.id}>Nationality</Label>
                <Input
                  {...getInputProps(fields.nationality, { type: "text" })}
                  key={fields.nationality.key}
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
          <Button type="submit">Save Changes</Button>
          <Button type="button" variant="outline" asChild>
            <Link to={`${basePrefix}/events/${eventId}/participants/${participant.id}`}>
              Cancel
            </Link>
          </Button>
        </div>
      </Form>
    </div>
  );
}
