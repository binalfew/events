import { data, useFetcher, useLoaderData, useSearchParams } from "react-router";
import { useState } from "react";
import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import {
  listDuplicateCandidates,
  reviewDuplicateCandidate,
  mergeParticipants,
  MergeError,
} from "~/services/participant-merge.server";
import { mergeParticipantsSchema } from "~/lib/schemas/duplicate-merge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Separator } from "~/components/ui/separator";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { Route } from "./+types/duplicates";

export const handle = { breadcrumb: "Duplicates" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "duplicates", "review");
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

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1", 10);

  const result = await listDuplicateCandidates(tenantId, {
    eventId,
    status: statusFilter as any,
    page,
    pageSize: 25,
  });

  // Load participant snapshots for display
  const participantIds = new Set<string>();
  for (const c of result.candidates) {
    participantIds.add(c.participantAId);
    participantIds.add(c.participantBId);
  }

  const participants =
    participantIds.size > 0
      ? await prisma.participant.findMany({
          where: { id: { in: Array.from(participantIds) } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            organization: true,
            jobTitle: true,
            nationality: true,
            extras: true,
            registrationCode: true,
            status: true,
          },
        })
      : [];

  const participantMap = Object.fromEntries(participants.map((p) => [p.id, p]));

  return {
    event,
    candidates: result.candidates,
    participantMap,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    statusFilter: statusFilter ?? "",
  };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "duplicates", "review");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  const ctx = {
    userId: user.id,
    tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    if (_action === "review_confirm") {
      const id = formData.get("id") as string;
      const reviewNotes = (formData.get("reviewNotes") as string) || undefined;
      await reviewDuplicateCandidate(id, "CONFIRMED_DUPLICATE", reviewNotes, ctx);
      return data({ success: true });
    }

    if (_action === "review_dismiss") {
      const id = formData.get("id") as string;
      const reviewNotes = (formData.get("reviewNotes") as string) || undefined;
      await reviewDuplicateCandidate(id, "NOT_DUPLICATE", reviewNotes, ctx);
      return data({ success: true });
    }

    if (_action === "merge") {
      const input = {
        survivingId: formData.get("survivingId") as string,
        mergedId: formData.get("mergedId") as string,
        fieldResolution: JSON.parse((formData.get("fieldResolution") as string) || "{}"),
        reviewNotes: (formData.get("reviewNotes") as string) || undefined,
      };

      const parsed = mergeParticipantsSchema.safeParse(input);
      if (!parsed.success) {
        return data({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      await mergeParticipants(parsed.data, ctx);
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof MergeError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "CONFIRMED_DUPLICATE", label: "Confirmed" },
  { value: "NOT_DUPLICATE", label: "Dismissed" },
  { value: "MERGED", label: "Merged" },
];

export default function DuplicatesPage() {
  const { event, candidates, participantMap, total, page, pageSize, statusFilter } =
    useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Duplicate Review Queue</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review potential duplicate participants for {event.name}.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-48">
          <NativeSelect
            value={statusFilter}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) {
                params.set("status", e.target.value);
              } else {
                params.delete("status");
              }
              params.delete("page");
              setSearchParams(params);
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <NativeSelectOption key={opt.value} value={opt.value}>
                {opt.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <span className="text-sm text-muted-foreground">
          {total} candidate{total !== 1 ? "s" : ""}
        </span>
      </div>

      <Separator />

      {candidates.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No duplicate candidates found. Candidates are detected during registration.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate: any) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              participantA={participantMap[candidate.participantAId]}
              participantB={participantMap[candidate.participantBId]}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set("page", String(page - 1));
              setSearchParams(params);
            }}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.set("page", String(page + 1));
              setSearchParams(params);
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const variant = score >= 0.9 ? "destructive" : "secondary";
  return <Badge variant={variant}>{pct}%</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
    CONFIRMED_DUPLICATE: "bg-red-100 text-red-800",
    NOT_DUPLICATE: "bg-green-100 text-green-800",
    MERGED: "bg-blue-100 text-blue-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-800"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function CandidateCard({
  candidate,
  participantA,
  participantB,
}: {
  candidate: any;
  participantA: any;
  participantB: any;
}) {
  const reviewFetcher = useFetcher();
  const [mergeOpen, setMergeOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  const matchFields = (candidate.matchFields as any[]) ?? [];
  const isPending = candidate.status === "PENDING_REVIEW";
  const isConfirmed = candidate.status === "CONFIRMED_DUPLICATE";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ConfidenceBadge score={candidate.confidenceScore} />
            <CardTitle className="text-base">
              {participantA?.firstName ?? "?"} {participantA?.lastName ?? "?"} —{" "}
              {participantB?.firstName ?? "?"} {participantB?.lastName ?? "?"}
            </CardTitle>
          </div>
          <StatusBadge status={candidate.status} />
        </div>
        <CardDescription>
          Matched on: {matchFields.map((f: any) => `${f.field} (${f.matchType})`).join(", ")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Participant A</p>
            <p>
              {participantA?.firstName} {participantA?.lastName}
            </p>
            <p className="text-muted-foreground">{participantA?.email ?? "—"}</p>
            <p className="text-muted-foreground">{participantA?.organization ?? "—"}</p>
            <p className="text-muted-foreground text-xs">Code: {participantA?.registrationCode}</p>
          </div>
          <div>
            <p className="font-medium">Participant B</p>
            <p>
              {participantB?.firstName} {participantB?.lastName}
            </p>
            <p className="text-muted-foreground">{participantB?.email ?? "—"}</p>
            <p className="text-muted-foreground">{participantB?.organization ?? "—"}</p>
            <p className="text-muted-foreground text-xs">Code: {participantB?.registrationCode}</p>
          </div>
        </div>

        {(isPending || isConfirmed) && (
          <div className="mt-4 flex items-center gap-2">
            <Input
              placeholder="Review notes (optional)"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="max-w-xs"
            />
            {isPending && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={reviewFetcher.state !== "idle"}
                  onClick={() => {
                    reviewFetcher.submit(
                      { _action: "review_confirm", id: candidate.id, reviewNotes },
                      { method: "POST" },
                    );
                  }}
                >
                  Confirm Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reviewFetcher.state !== "idle"}
                  onClick={() => {
                    reviewFetcher.submit(
                      { _action: "review_dismiss", id: candidate.id, reviewNotes },
                      { method: "POST" },
                    );
                  }}
                >
                  Dismiss
                </Button>
              </>
            )}
            {(isPending || isConfirmed) && (
              <Button size="sm" onClick={() => setMergeOpen(true)}>
                Merge
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <MergeDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        candidateId={candidate.id}
        participantA={participantA}
        participantB={participantB}
      />
    </Card>
  );
}

const MERGE_FIELDS = ["firstName", "lastName", "email", "organization", "jobTitle", "nationality"];

function MergeDialog({
  open,
  onOpenChange,
  candidateId,
  participantA,
  participantB,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  participantA: any;
  participantB: any;
}) {
  const fetcher = useFetcher();
  const [survivingId, setSurvivingId] = useState(participantA?.id ?? "");
  const [fieldResolution, setFieldResolution] = useState<Record<string, "surviving" | "merged">>(
    () => {
      const res: Record<string, "surviving" | "merged"> = {};
      for (const field of MERGE_FIELDS) {
        res[field] = "surviving";
      }
      return res;
    },
  );
  const [reviewNotes, setReviewNotes] = useState("");

  const mergedId = survivingId === participantA?.id ? participantB?.id : participantA?.id;

  const getSurviving = () => (survivingId === participantA?.id ? participantA : participantB);
  const getMerged = () => (survivingId === participantA?.id ? participantB : participantA);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Merge Participants</DialogTitle>
          <DialogDescription>
            Choose which record survives and resolve field conflicts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Surviving Record</Label>
            <NativeSelect value={survivingId} onChange={(e) => setSurvivingId(e.target.value)}>
              <NativeSelectOption value={participantA?.id ?? ""}>
                {participantA?.firstName} {participantA?.lastName} ({participantA?.registrationCode}
                )
              </NativeSelectOption>
              <NativeSelectOption value={participantB?.id ?? ""}>
                {participantB?.firstName} {participantB?.lastName} ({participantB?.registrationCode}
                )
              </NativeSelectOption>
            </NativeSelect>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Field Resolution</p>
            {MERGE_FIELDS.map((field) => {
              const survVal = String(getSurviving()?.[field] ?? "—");
              const mergedVal = String(getMerged()?.[field] ?? "—");
              return (
                <div key={field} className="grid grid-cols-3 items-center gap-2 text-sm">
                  <span className="font-medium capitalize">
                    {field.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={`field-${field}`}
                      checked={fieldResolution[field] === "surviving"}
                      onChange={() =>
                        setFieldResolution((prev) => ({ ...prev, [field]: "surviving" }))
                      }
                    />
                    <span className="truncate" title={survVal}>
                      {survVal}
                    </span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name={`field-${field}`}
                      checked={fieldResolution[field] === "merged"}
                      onChange={() =>
                        setFieldResolution((prev) => ({ ...prev, [field]: "merged" }))
                      }
                    />
                    <span className="truncate" title={mergedVal}>
                      {mergedVal}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>

          <div>
            <Label htmlFor="merge-notes">Review Notes</Label>
            <Input
              id="merge-notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Optional notes about this merge"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            disabled={fetcher.state !== "idle"}
            onClick={() => {
              fetcher.submit(
                {
                  _action: "merge",
                  survivingId,
                  mergedId,
                  fieldResolution: JSON.stringify(fieldResolution),
                  reviewNotes,
                },
                { method: "POST" },
              );
              onOpenChange(false);
            }}
          >
            {fetcher.state !== "idle" ? "Merging..." : "Merge Participants"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
