import { data, useFetcher, useLoaderData } from "react-router";
import { useState } from "react";
import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import {
  createBlacklistEntry,
  listBlacklistEntries,
  updateBlacklistEntry,
  deactivateBlacklistEntry,
  deleteBlacklistEntry,
  BlacklistError,
} from "~/services/blacklist.server";
import { createBlacklistSchema, BLACKLIST_TYPES } from "~/lib/schemas/duplicate-merge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { DatePicker } from "~/components/ui/date-picker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import type { Route } from "./+types/blacklist";

export const handle = { breadcrumb: "Blacklist" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "blacklist", "manage");
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

  const result = await listBlacklistEntries(tenantId, {});

  return { event, entries: result.entries, total: result.total };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "blacklist", "manage");
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
    if (_action === "create") {
      const input = {
        type: formData.get("type") as string,
        name: (formData.get("name") as string) || undefined,
        nameVariations: (formData.get("nameVariations") as string) || undefined,
        passportNumber: (formData.get("passportNumber") as string) || undefined,
        email: (formData.get("email") as string) || undefined,
        reason: formData.get("reason") as string,
        source: (formData.get("source") as string) || undefined,
        expiresAt: formData.get("expiresAt")
          ? new Date(formData.get("expiresAt") as string)
          : undefined,
      };

      const parsed = createBlacklistSchema.safeParse(input);
      if (!parsed.success) {
        return data({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      await createBlacklistEntry(parsed.data, ctx);
      return data({ success: true });
    }

    if (_action === "update") {
      const id = formData.get("id") as string;
      if (!id) return data({ error: "Entry ID is required" }, { status: 400 });

      const input: Record<string, unknown> = {};
      const type = formData.get("type") as string;
      const name = formData.get("name") as string;
      const nameVariations = formData.get("nameVariations") as string;
      const passportNumber = formData.get("passportNumber") as string;
      const email = formData.get("email") as string;
      const reason = formData.get("reason") as string;
      const source = formData.get("source") as string;

      if (type) input.type = type;
      if (name !== null) input.name = name || undefined;
      if (nameVariations !== null) input.nameVariations = nameVariations || undefined;
      if (passportNumber !== null) input.passportNumber = passportNumber || undefined;
      if (email !== null) input.email = email || undefined;
      if (reason) input.reason = reason;
      if (source !== null) input.source = source || undefined;

      await updateBlacklistEntry(id, input as any, ctx);
      return data({ success: true });
    }

    if (_action === "deactivate") {
      const id = formData.get("id") as string;
      if (!id) return data({ error: "Entry ID is required" }, { status: 400 });
      await deactivateBlacklistEntry(id, ctx);
      return data({ success: true });
    }

    if (_action === "delete") {
      const id = formData.get("id") as string;
      if (!id) return data({ error: "Entry ID is required" }, { status: 400 });
      await deleteBlacklistEntry(id, ctx);
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof BlacklistError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

export default function BlacklistPage() {
  const { event, entries, total } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Blacklist</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage blocked individuals for {event.name}.
          </p>
        </div>
        <CreateBlacklistDialog />
      </div>

      <Separator />

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No blacklist entries. Add entries to block individuals from registration.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Blacklist Entries</CardTitle>
            <CardDescription>
              {total} entr{total !== 1 ? "ies" : "y"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 font-medium">Passport</th>
                    <th className="pb-2 pr-4 font-medium">Email</th>
                    <th className="pb-2 pr-4 font-medium">Reason</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Expires</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {entries.map((entry: any) => (
                    <BlacklistRow key={entry.id} entry={entry} />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────

function CreateBlacklistDialog() {
  const fetcher = useFetcher();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Entry</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Blacklist Entry</DialogTitle>
          <DialogDescription>Block an individual from registering for events.</DialogDescription>
        </DialogHeader>
        <fetcher.Form method="POST" onSubmit={() => setOpen(false)}>
          <input type="hidden" name="_action" value="create" />
          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <NativeSelect id="type" name="type" required>
                {BLACKLIST_TYPES.map((t) => (
                  <NativeSelectOption key={t} value={t}>
                    {t}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Full name" />
            </div>
            <div>
              <Label htmlFor="nameVariations">Name Variations (comma-separated)</Label>
              <Input
                id="nameVariations"
                name="nameVariations"
                placeholder="John Doe, Jon Doe, J. Doe"
              />
            </div>
            <div>
              <Label htmlFor="passportNumber">Passport Number</Label>
              <Input id="passportNumber" name="passportNumber" placeholder="AB1234567" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="person@example.com" />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" name="reason" placeholder="Reason for blacklisting" required />
            </div>
            <div>
              <Label htmlFor="source">Source</Label>
              <Input id="source" name="source" placeholder="e.g. Security report" />
            </div>
            <div>
              <Label htmlFor="expiresAt">Expires At (optional)</Label>
              <DatePicker id="expiresAt" name="expiresAt" placeholder="No expiry" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={fetcher.state !== "idle"}>
              {fetcher.state !== "idle" ? "Adding..." : "Add Entry"}
            </Button>
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}

function EditBlacklistDialog({
  entry,
  open,
  onOpenChange,
}: {
  entry: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fetcher = useFetcher();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Blacklist Entry</DialogTitle>
          <DialogDescription>Update blacklist entry details.</DialogDescription>
        </DialogHeader>
        <fetcher.Form method="POST" onSubmit={() => onOpenChange(false)}>
          <input type="hidden" name="_action" value="update" />
          <input type="hidden" name="id" value={entry.id} />
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-type">Type</Label>
              <NativeSelect id="edit-type" name="type" defaultValue={entry.type}>
                {BLACKLIST_TYPES.map((t) => (
                  <NativeSelectOption key={t} value={t}>
                    {t}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" name="name" defaultValue={entry.name ?? ""} />
            </div>
            <div>
              <Label htmlFor="edit-nameVariations">Name Variations (comma-separated)</Label>
              <Input
                id="edit-nameVariations"
                name="nameVariations"
                defaultValue={(entry.nameVariations ?? []).join(", ")}
              />
            </div>
            <div>
              <Label htmlFor="edit-passportNumber">Passport Number</Label>
              <Input
                id="edit-passportNumber"
                name="passportNumber"
                defaultValue={entry.passportNumber ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" name="email" defaultValue={entry.email ?? ""} />
            </div>
            <div>
              <Label htmlFor="edit-reason">Reason</Label>
              <Textarea id="edit-reason" name="reason" defaultValue={entry.reason} required />
            </div>
            <div>
              <Label htmlFor="edit-source">Source</Label>
              <Input id="edit-source" name="source" defaultValue={entry.source ?? ""} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={fetcher.state !== "idle"}>
              {fetcher.state !== "idle" ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}

function BlacklistRow({ entry }: { entry: any }) {
  const deactivateFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <tr>
      <td className="py-3 pr-4 font-medium">{entry.name ?? "—"}</td>
      <td className="py-3 pr-4">
        <Badge variant="secondary">{entry.type}</Badge>
      </td>
      <td className="py-3 pr-4 text-muted-foreground">{entry.passportNumber ?? "—"}</td>
      <td className="py-3 pr-4 text-muted-foreground">{entry.email ?? "—"}</td>
      <td className="py-3 pr-4 text-muted-foreground max-w-xs truncate">{entry.reason}</td>
      <td className="py-3 pr-4">
        <Badge variant={entry.isActive ? "default" : "secondary"}>
          {entry.isActive ? "Active" : "Inactive"}
        </Badge>
      </td>
      <td className="py-3 pr-4 text-muted-foreground text-xs">
        {entry.expiresAt ? new Date(entry.expiresAt).toLocaleDateString() : "Never"}
      </td>
      <td className="py-3">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          {entry.isActive && (
            <Button
              variant="outline"
              size="sm"
              disabled={deactivateFetcher.state !== "idle"}
              onClick={() => {
                deactivateFetcher.submit(
                  { _action: "deactivate", id: entry.id },
                  { method: "POST" },
                );
              }}
            >
              Deactivate
            </Button>
          )}
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Blacklist Entry</DialogTitle>
                <DialogDescription>
                  This will permanently delete this blacklist entry. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteFetcher.submit({ _action: "delete", id: entry.id }, { method: "POST" });
                    setDeleteOpen(false);
                  }}
                >
                  Delete Entry
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <EditBlacklistDialog entry={entry} open={editOpen} onOpenChange={setEditOpen} />
      </td>
    </tr>
  );
}
