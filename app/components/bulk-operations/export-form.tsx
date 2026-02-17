import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";

// ─── Types ───────────────────────────────────────────────

interface FieldOption {
  name: string;
  label: string;
  isFixed: boolean;
}

interface ParticipantTypeOption {
  id: string;
  name: string;
}

interface ExportFormProps {
  eventId: string;
  fields: FieldOption[];
  participantTypes: ParticipantTypeOption[];
  isSubmitting?: boolean;
}

// ─── Fixed fields ────────────────────────────────────────

const FIXED_FIELDS: FieldOption[] = [
  { name: "firstName", label: "First Name", isFixed: true },
  { name: "lastName", label: "Last Name", isFixed: true },
  { name: "email", label: "Email", isFixed: true },
  { name: "organization", label: "Organization", isFixed: true },
  { name: "jobTitle", label: "Job Title", isFixed: true },
  { name: "nationality", label: "Nationality", isFixed: true },
  { name: "registrationCode", label: "Registration Code", isFixed: true },
  { name: "status", label: "Status", isFixed: true },
  { name: "participantType", label: "Participant Type", isFixed: true },
  { name: "createdAt", label: "Created At", isFixed: true },
];

// ─── Component ───────────────────────────────────────────

export function ExportForm({ eventId, fields, participantTypes, isSubmitting }: ExportFormProps) {
  const allFields = [...FIXED_FIELDS, ...fields.map((f) => ({ ...f, isFixed: false }))];
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(allFields.map((f) => f.name)),
  );

  const toggleField = (name: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedFields(new Set(allFields.map((f) => f.name)));
  const selectNone = () => setSelectedFields(new Set());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Participants</CardTitle>
      </CardHeader>
      <CardContent>
        <form method="POST">
          <input type="hidden" name="_action" value="export" />
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="fields" value={JSON.stringify([...selectedFields])} />

          <div className="space-y-6">
            {/* Field selection */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Fields to export</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs text-primary hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={selectNone}
                    className="text-xs text-primary hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {allFields.map((field) => (
                  <label
                    key={field.name}
                    className="flex items-center gap-2 rounded border p-2 text-sm hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.has(field.name)}
                      onChange={() => toggleField(field.name)}
                      className="rounded"
                    />
                    <span>{field.label}</span>
                    {!field.isFixed && (
                      <span className="text-xs text-muted-foreground">(custom)</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <Label>Status</Label>
                <NativeSelect name="filterStatus" defaultValue="">
                  <NativeSelectOption value="">All statuses</NativeSelectOption>
                  <NativeSelectOption value="PENDING">Pending</NativeSelectOption>
                  <NativeSelectOption value="IN_PROGRESS">In Progress</NativeSelectOption>
                  <NativeSelectOption value="APPROVED">Approved</NativeSelectOption>
                  <NativeSelectOption value="REJECTED">Rejected</NativeSelectOption>
                  <NativeSelectOption value="CANCELLED">Cancelled</NativeSelectOption>
                  <NativeSelectOption value="PRINTED">Printed</NativeSelectOption>
                </NativeSelect>
              </div>

              {participantTypes.length > 0 && (
                <div className="w-48">
                  <Label>Participant Type</Label>
                  <NativeSelect name="filterParticipantType" defaultValue="">
                    <NativeSelectOption value="">All types</NativeSelectOption>
                    {participantTypes.map((pt) => (
                      <NativeSelectOption key={pt.id} value={pt.id}>
                        {pt.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              )}
            </div>

            {/* Export button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || selectedFields.size === 0}>
                {isSubmitting ? "Exporting..." : `Export CSV (${selectedFields.size} fields)`}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
