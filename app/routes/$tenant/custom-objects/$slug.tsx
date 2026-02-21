import { data, Form, Link, useLoaderData, redirect } from "react-router";
import { Plus, Trash2, ArrowLeft, Pencil } from "lucide-react";
import { requireAuth } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import {
  getDefinitionBySlug,
  listRecords,
  createRecord,
  deleteRecord,
  updateDefinition,
  CustomObjectError,
} from "~/services/custom-objects.server";
import type { CustomFieldDefinition } from "~/services/custom-objects.server";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { EmptyState } from "~/components/ui/empty-state";
import { Input } from "~/components/ui/input";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DatePicker } from "~/components/ui/date-picker";
import { useBasePrefix } from "~/hooks/use-base-prefix";
import type { Route } from "./+types/$slug";

export const handle = { breadcrumb: "Object Detail" };

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user, roles } = await requireAuth(request);
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.CUSTOM_OBJECTS, {
    tenantId,
    roles,
    userId: user.id,
  });
  if (!enabled) {
    throw data({ error: "Custom objects is not enabled" }, { status: 404 });
  }

  const definition = await getDefinitionBySlug(tenantId, params.slug);
  const records = await listRecords(definition.id, tenantId);
  const fields = definition.fields as unknown as CustomFieldDefinition[];

  return { definition, records, fields, tenantId };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requireAuth(request);
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const _action = formData.get("_action") as string;
  const slug = params.slug;

  try {
    switch (_action) {
      case "add-field": {
        const definition = await getDefinitionBySlug(tenantId, slug);
        const existingFields = definition.fields as unknown as CustomFieldDefinition[];
        const fieldName = formData.get("fieldName") as string;
        const fieldLabel = formData.get("fieldLabel") as string;
        const fieldType = formData.get("fieldType") as string;
        const fieldRequired = formData.get("fieldRequired") === "on";

        if (!fieldName || !fieldLabel || !fieldType) {
          return data({ error: "Field name, label, and type are required" }, { status: 400 });
        }

        const newField: CustomFieldDefinition = {
          name: fieldName,
          label: fieldLabel,
          dataType: fieldType,
          required: fieldRequired,
        };

        await updateDefinition(definition.id, {
          fields: [...existingFields, newField],
        });
        break;
      }

      case "create-record": {
        const definition = await getDefinitionBySlug(tenantId, slug);
        const fields = definition.fields as unknown as CustomFieldDefinition[];
        const recordData: Record<string, unknown> = {};

        for (const field of fields) {
          const value = formData.get(`field_${field.name}`);
          if (value !== null && value !== "") {
            recordData[field.name] = String(value);
          }
        }

        await createRecord({
          definitionId: definition.id,
          tenantId,
          data: recordData,
          createdBy: user.id,
        });
        break;
      }

      case "delete-record": {
        const recordId = formData.get("recordId") as string;
        await deleteRecord(recordId);
        break;
      }

      default:
        return data({ error: "Unknown action" }, { status: 400 });
    }

    return redirect(`/${params.tenant}/custom-objects/${slug}`);
  } catch (error) {
    if (error instanceof CustomObjectError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

const FIELD_TYPES = ["TEXT", "NUMBER", "BOOLEAN", "DATE", "EMAIL", "URL", "ENUM"] as const;

export default function CustomObjectDetailPage() {
  const { definition, records, fields } = useLoaderData<typeof loader>();
  const basePrefix = useBasePrefix();

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`${basePrefix}/custom-objects`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Back to Custom Objects
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{definition.name}</h1>
          <Badge variant="outline">{definition.slug}</Badge>
          {!definition.isActive && <Badge variant="secondary">Inactive</Badge>}
        </div>
        {definition.description && (
          <p className="mt-1 text-muted-foreground">{definition.description}</p>
        )}
      </div>

      <Separator />

      {/* Add Field */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Pencil className="size-4" />
            Add Field to Schema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="flex flex-wrap items-end gap-4">
            <input type="hidden" name="_action" value="add-field" />
            <div>
              <label
                htmlFor="fieldName"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Field Name
              </label>
              <Input
                id="fieldName"
                name="fieldName"
                required
                placeholder="e.g. plate_number"
                pattern="^[a-z][a-z0-9_]*$"
                className="w-40"
              />
            </div>
            <div>
              <label
                htmlFor="fieldLabel"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Label
              </label>
              <Input
                id="fieldLabel"
                name="fieldLabel"
                required
                placeholder="e.g. License Plate"
                className="w-40"
              />
            </div>
            <div>
              <label
                htmlFor="fieldType"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Type
              </label>
              <NativeSelect id="fieldType" name="fieldType">
                {FIELD_TYPES.map((t) => (
                  <NativeSelectOption key={t} value={t}>
                    {t}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="flex items-center gap-2">
              <input id="fieldRequired" name="fieldRequired" type="checkbox" className="size-4" />
              <label htmlFor="fieldRequired" className="text-xs text-muted-foreground">
                Required
              </label>
            </div>
            <Button type="submit" size="sm" variant="secondary">
              Add Field
            </Button>
          </Form>
        </CardContent>
      </Card>

      {/* Fields Schema Display */}
      {fields.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
            Schema ({fields.length} fields)
          </h3>
          <div className="flex flex-wrap gap-2">
            {fields.map((f) => (
              <Badge key={f.name} variant="outline" className="text-xs">
                {f.label} ({f.dataType}){f.required ? " *" : ""}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Create Record */}
      {fields.length > 0 && definition.isActive && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="size-4" />
              New Record
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form method="post" className="flex flex-wrap items-end gap-4">
              <input type="hidden" name="_action" value="create-record" />
              {fields.map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={`field_${field.name}`}
                    className="mb-1 block text-xs font-medium text-muted-foreground"
                  >
                    {field.label}
                    {field.required && " *"}
                  </label>
                  {field.dataType === "DATE" ? (
                    <DatePicker
                      id={`field_${field.name}`}
                      name={`field_${field.name}`}
                      required={field.required}
                      placeholder={`Select ${field.label.toLowerCase()}`}
                      className="w-48"
                    />
                  ) : (
                    <Input
                      id={`field_${field.name}`}
                      name={`field_${field.name}`}
                      required={field.required}
                      type={
                        field.dataType === "NUMBER"
                          ? "number"
                          : field.dataType === "EMAIL"
                            ? "email"
                            : field.dataType === "URL"
                              ? "url"
                              : "text"
                      }
                      className="w-40"
                    />
                  )}
                </div>
              ))}
              <Button type="submit" size="sm">
                Add Record
              </Button>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Records Table */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Records ({records.length})</h3>
        {records.length === 0 ? (
          <EmptyState
            title="No records"
            description={
              fields.length === 0
                ? "Add fields to the schema first, then create records."
                : "Create your first record using the form above."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {fields.map((f) => (
                    <th
                      key={f.name}
                      className="px-3 py-2 text-left font-medium text-muted-foreground"
                    >
                      {f.label}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Created</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const recData = record.data as Record<string, unknown>;
                  return (
                    <tr key={record.id} className="border-b last:border-b-0">
                      {fields.map((f) => (
                        <td key={f.name} className="px-3 py-2">
                          {String(recData[f.name] ?? "—")}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Form method="post" className="inline">
                          <input type="hidden" name="_action" value="delete-record" />
                          <input type="hidden" name="recordId" value={record.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </Form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
