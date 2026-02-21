import { data, Link, useLoaderData, useSearchParams, useFetcher } from "react-router";
import { Plus } from "lucide-react";
import { useState, useMemo } from "react";
import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import { getEffectiveFields } from "~/services/fields.server";
import { batchActionSchema, participantListFilterSchema } from "~/lib/schemas/batch-action";
import { executeBatchAction, dryRunBatchAction } from "~/services/batch-workflow-actions.server";
import { validateBatchEligibility } from "~/services/batch-selection.server";
import { undoOperation } from "~/services/bulk-operations.server";
import { useKeyboardShortcuts } from "~/lib/use-keyboard-shortcuts";
import type { ShortcutDefinition } from "~/lib/use-keyboard-shortcuts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Separator } from "~/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { BatchActionBar } from "~/components/batch-actions/batch-action-bar";
import { BatchConfirmationDialog } from "~/components/batch-actions/batch-confirmation-dialog";
import { BatchProgressDialog } from "~/components/batch-actions/batch-progress-dialog";
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

  const eventId = params.eventId;
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
    select: { id: true, name: true },
  });
  if (!event) {
    throw data({ error: "Event not found" }, { status: 404 });
  }

  // Parse filters
  const url = new URL(request.url);
  const filterInput = {
    search: url.searchParams.get("search") || undefined,
    status: url.searchParams.get("status") || undefined,
    participantTypeId: url.searchParams.get("participantTypeId") || undefined,
    page: url.searchParams.get("page") || "1",
    pageSize: url.searchParams.get("pageSize") || "25",
  };
  const filters = participantListFilterSchema.parse(filterInput);

  // Build where clause
  const where: Record<string, unknown> = {
    eventId,
    tenantId,
    deletedAt: null,
  };

  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { registrationCode: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.participantTypeId) {
    where.participantTypeId = filters.participantTypeId;
  }

  const [participants, totalCount, participantTypes, fieldDefs] = await Promise.all([
    prisma.participant.findMany({
      where: where as any,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        registrationCode: true,
        status: true,
        organization: true,
        extras: true,
        participantType: { select: { id: true, name: true } },
        currentStepId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.participant.count({ where: where as any }),
    prisma.participantType.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getEffectiveFields(tenantId, eventId, "Participant"),
  ]);

  // Count without pagination for "select all filtered"
  const totalFilteredCount = totalCount;

  return {
    event,
    participants,
    participantTypes,
    fieldDefs,
    totalFilteredCount,
    meta: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: totalCount,
      totalPages: Math.ceil(totalCount / filters.pageSize),
    },
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "bulk-operations", "execute");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const _action = formData.get("_action") as string;
  const ctx = { userId: user.id, tenantId };

  try {
    if (_action === "batch-action") {
      const input = batchActionSchema.parse({
        eventId: params.eventId,
        action: formData.get("action"),
        participantIds: JSON.parse(formData.get("participantIds") as string),
        remarks: formData.get("remarks") || undefined,
        dryRun: formData.get("dryRun") === "true",
      });

      if (input.dryRun) {
        const result = await dryRunBatchAction(input, ctx);
        return data({ dryRun: true, ...result });
      }

      const result = await executeBatchAction(input, ctx);
      return data({ success: true, ...result });
    }

    if (_action === "validate-eligibility") {
      const action = formData.get("action") as string;
      const participantIds = JSON.parse(formData.get("participantIds") as string);
      const result = await validateBatchEligibility(participantIds, action as any, tenantId);
      return data({ eligibility: result });
    }

    if (_action === "undo") {
      const operationId = formData.get("operationId") as string;
      const result = await undoOperation(operationId, ctx);
      return data({ undone: true, ...result });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return data(
      { error: error.message ?? "Operation failed" },
      { status: error.statusCode ?? 500 },
    );
  }
}

// ─── Component ────────────────────────────────────────────

export default function ParticipantListPage() {
  const { event, participants, participantTypes, fieldDefs, totalFilteredCount, meta } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [allFilteredSelected, setAllFilteredSelected] = useState(false);

  // Dialog state
  const [confirmAction, setConfirmAction] = useState<"APPROVE" | "REJECT" | "BYPASS" | null>(null);
  const [eligibility, setEligibility] = useState<{
    eligible: string[];
    ineligible: { id: string; name: string; reason: string }[];
  } | null>(null);
  const [progressResult, setProgressResult] = useState<{
    operationId: string;
    totalItems: number;
    successCount: number;
    failureCount: number;
    status: string;
  } | null>(null);

  const pageParticipantIds = useMemo(() => participants.map((p: any) => p.id), [participants]);

  const isSubmitting = fetcher.state !== "idle";

  // Handle fetcher data for eligibility validation and batch action results
  const fetcherData = fetcher.data as any;
  if (fetcherData?.eligibility && confirmAction && !eligibility) {
    setEligibility(fetcherData.eligibility);
  }
  if (fetcherData?.success && fetcherData?.operationId && !progressResult) {
    setProgressResult({
      operationId: fetcherData.operationId,
      totalItems: fetcherData.totalItems,
      successCount: fetcherData.successCount,
      failureCount: fetcherData.failureCount,
      status: fetcherData.status,
    });
    setConfirmAction(null);
    setEligibility(null);
    setSelectedIds(new Set());
    setAllFilteredSelected(false);
  }

  // ─── Selection helpers ─────────────────────────────────

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setAllFilteredSelected(false);
  }

  function selectAllOnPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of pageParticipantIds) {
        next.add(id);
      }
      return next;
    });
  }

  function deselectAllOnPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of pageParticipantIds) {
        next.delete(id);
      }
      return next;
    });
  }

  const allOnPageSelected =
    pageParticipantIds.length > 0 && pageParticipantIds.every((id: string) => selectedIds.has(id));

  function toggleAllOnPage() {
    if (allOnPageSelected) {
      deselectAllOnPage();
    } else {
      selectAllOnPage();
    }
  }

  function handleSelectAllFiltered() {
    // Select all on current page and mark allFiltered
    selectAllOnPage();
    setAllFilteredSelected(true);
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setAllFilteredSelected(false);
  }

  // ─── Batch action flow ─────────────────────────────────

  function openBatchAction(action: "APPROVE" | "REJECT" | "BYPASS") {
    setConfirmAction(action);
    setEligibility(null);

    // Validate eligibility
    fetcher.submit(
      {
        _action: "validate-eligibility",
        action,
        participantIds: JSON.stringify(Array.from(selectedIds)),
      },
      { method: "POST" },
    );
  }

  function handleConfirm(remarks?: string) {
    if (!confirmAction || !eligibility) return;

    fetcher.submit(
      {
        _action: "batch-action",
        action: confirmAction,
        participantIds: JSON.stringify(eligibility.eligible),
        remarks: remarks ?? "",
        dryRun: "false",
      },
      { method: "POST" },
    );
  }

  function handleUndo() {
    if (!progressResult?.operationId) return;
    fetcher.submit(
      {
        _action: "undo",
        operationId: progressResult.operationId,
      },
      { method: "POST" },
    );
    setProgressResult(null);
  }

  // ─── Filter helpers ─────────────────────────────────────

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    setSearchParams(params);
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  }

  // ─── Keyboard shortcuts ────────────────────────────────

  const shortcuts: ShortcutDefinition[] = useMemo(
    () => [
      {
        id: "select-all-page",
        keys: "Ctrl+A",
        description: "Select all on page",
        group: "workflow" as const,
        key: "a",
        mod: true,
        handler: () => {
          toggleAllOnPage();
        },
      },
      {
        id: "select-all-filtered",
        keys: "Ctrl+Shift+A",
        description: "Select all matching filter",
        group: "workflow" as const,
        key: "a",
        mod: true,
        shift: true,
        handler: () => {
          handleSelectAllFiltered();
        },
      },
      {
        id: "clear-selection",
        keys: "Escape",
        description: "Clear selection",
        group: "workflow" as const,
        key: "escape",
        handler: () => {
          clearSelection();
        },
      },
    ],
    [pageParticipantIds, selectedIds, allOnPageSelected],
  );

  useKeyboardShortcuts(shortcuts);

  const currentSearch = searchParams.get("search") ?? "";
  const currentStatus = searchParams.get("status") ?? "";
  const currentPType = searchParams.get("participantTypeId") ?? "";
  const effectiveSelectedCount = allFilteredSelected ? totalFilteredCount : selectedIds.size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Participants</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage participants for {event.name}. Select participants to perform batch workflow
            actions.
          </p>
        </div>
        <Button asChild>
          <Link to="new">
            <Plus className="mr-2 h-4 w-4" />
            Add Participant
          </Link>
        </Button>
      </div>

      <Separator />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-64">
          <Label>Search</Label>
          <Input
            placeholder="Name, email, or code..."
            defaultValue={currentSearch}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateFilter("search", (e.target as HTMLInputElement).value);
              }
            }}
          />
        </div>
        <div className="w-40">
          <Label>Status</Label>
          <NativeSelect
            value={currentStatus}
            onChange={(e) => updateFilter("status", e.target.value)}
          >
            <NativeSelectOption value="">All statuses</NativeSelectOption>
            <NativeSelectOption value="PENDING">Pending</NativeSelectOption>
            <NativeSelectOption value="IN_PROGRESS">In Progress</NativeSelectOption>
            <NativeSelectOption value="APPROVED">Approved</NativeSelectOption>
            <NativeSelectOption value="REJECTED">Rejected</NativeSelectOption>
            <NativeSelectOption value="CANCELLED">Cancelled</NativeSelectOption>
            <NativeSelectOption value="PRINTED">Printed</NativeSelectOption>
          </NativeSelect>
        </div>
        <div className="w-48">
          <Label>Participant Type</Label>
          <NativeSelect
            value={currentPType}
            onChange={(e) => updateFilter("participantTypeId", e.target.value)}
          >
            <NativeSelectOption value="">All types</NativeSelectOption>
            {participantTypes.map((pt: any) => (
              <NativeSelectOption key={pt.id} value={pt.id}>
                {pt.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        {(currentSearch || currentStatus || currentPType) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchParams(new URLSearchParams())}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Participant Table */}
      <Card>
        <CardHeader>
          <CardTitle>Participant List</CardTitle>
          <CardDescription>
            {meta.total} participant{meta.total !== 1 ? "s" : ""} total
            {selectedIds.size > 0 && (
              <span className="ml-2 font-medium text-foreground">
                ({effectiveSelectedCount} selected)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected && pageParticipantIds.length > 0}
                      onChange={toggleAllOnPage}
                      className="size-4 rounded border-gray-300"
                      aria-label="Select all on page"
                    />
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Name</TableHead>
                  <TableHead className="whitespace-nowrap">Email</TableHead>
                  <TableHead className="whitespace-nowrap">Reg. Code</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Organization</TableHead>
                  {fieldDefs.map((fd: any) => (
                    <TableHead key={fd.id} className="whitespace-nowrap">
                      {fd.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7 + fieldDefs.length} className="h-24 text-center">
                      No participants found.
                    </TableCell>
                  </TableRow>
                ) : (
                  participants.map((p: any) => (
                    <TableRow
                      key={p.id}
                      data-state={selectedIds.has(p.id) ? "selected" : undefined}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="size-4 rounded border-gray-300"
                          aria-label={`Select ${p.firstName} ${p.lastName}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link to={p.id} className="text-primary hover:underline">
                          {p.firstName} {p.lastName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.email ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{p.registrationCode}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.participantType?.name ?? "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status] ?? ""}`}
                        >
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.organization ?? "—"}
                      </TableCell>
                      {fieldDefs.map((fd: any) => {
                        const extras = (p.extras ?? {}) as Record<string, unknown>;
                        const val = extras[fd.name];
                        return (
                          <TableCell
                            key={fd.id}
                            className="text-muted-foreground text-sm whitespace-nowrap"
                          >
                            {formatCellValue(fd, val)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => goToPage(meta.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => goToPage(meta.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Action Bar */}
      {selectedIds.size > 0 && (
        <BatchActionBar
          selectedCount={effectiveSelectedCount}
          totalFilteredCount={totalFilteredCount}
          onApprove={() => openBatchAction("APPROVE")}
          onReject={() => openBatchAction("REJECT")}
          onBypass={() => openBatchAction("BYPASS")}
          onSelectAllFiltered={handleSelectAllFiltered}
          onClear={clearSelection}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <BatchConfirmationDialog
          open={confirmAction !== null}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmAction(null);
              setEligibility(null);
            }
          }}
          action={confirmAction}
          eligibleCount={eligibility?.eligible.length ?? 0}
          ineligibleItems={eligibility?.ineligible ?? []}
          onConfirm={handleConfirm}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Progress Dialog */}
      {progressResult && (
        <BatchProgressDialog
          open={progressResult !== null}
          onOpenChange={(open) => {
            if (!open) setProgressResult(null);
          }}
          totalItems={progressResult.totalItems}
          successCount={progressResult.successCount}
          failureCount={progressResult.failureCount}
          status={progressResult.status}
          operationId={progressResult.operationId}
          onUndo={handleUndo}
        />
      )}

      {/* Spacer for sticky batch action bar */}
      {selectedIds.size > 0 && <div className="h-16" />}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────

function formatCellValue(fieldDef: any, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";

  switch (fieldDef.dataType) {
    case "BOOLEAN":
      return value ? "Yes" : "No";
    case "MULTI_ENUM": {
      if (Array.isArray(value)) {
        const options = (fieldDef.config as any)?.options as
          | Array<{ value: string; label: string }>
          | undefined;
        if (options) {
          const labelMap = new Map(options.map((o: any) => [o.value, o.label]));
          return value.map((v) => labelMap.get(String(v)) ?? v).join(", ");
        }
        return value.join(", ");
      }
      return String(value);
    }
    case "ENUM": {
      const options = (fieldDef.config as any)?.options as
        | Array<{ value: string; label: string }>
        | undefined;
      if (options) {
        const match = options.find((o: any) => o.value === String(value));
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
