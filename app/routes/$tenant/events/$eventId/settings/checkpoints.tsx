import { data, useFetcher, useLoaderData } from "react-router";
import { useState } from "react";
import { requirePermission } from "~/lib/require-auth.server";
import { prisma } from "~/lib/db.server";
import {
  createCheckpoint,
  listCheckpoints,
  updateCheckpoint,
  deleteCheckpoint,
  toggleCheckpoint,
  CheckpointError,
} from "~/services/checkpoints.server";
import {
  createCheckpointSchema,
  CHECKPOINT_TYPES,
  CHECKPOINT_DIRECTIONS,
} from "~/lib/schemas/checkpoint";
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
  DialogTrigger,
} from "~/components/ui/dialog";
import type { Route } from "./+types/checkpoints";

export const handle = { breadcrumb: "Checkpoints" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user } = await requirePermission(request, "check-in", "scan");
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

  const checkpoints = await listCheckpoints(tenantId, { eventId });

  return { event, checkpoints };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user } = await requirePermission(request, "check-in", "scan");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;
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
        eventId,
        name: formData.get("name") as string,
        location: (formData.get("location") as string) || undefined,
        type: formData.get("type") as string,
        direction: formData.get("direction") as string,
        capacity: formData.get("capacity") ? Number(formData.get("capacity")) : undefined,
      };

      const parsed = createCheckpointSchema.safeParse(input);
      if (!parsed.success) {
        return data({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      await createCheckpoint(parsed.data, ctx);
      return data({ success: true });
    }

    if (_action === "update") {
      const id = formData.get("id") as string;
      if (!id) return data({ error: "Checkpoint ID is required" }, { status: 400 });

      const input: Record<string, unknown> = {};
      const name = formData.get("name") as string;
      const location = formData.get("location") as string;
      const type = formData.get("type") as string;
      const direction = formData.get("direction") as string;
      const capacity = formData.get("capacity") as string;

      if (name) input.name = name;
      if (location !== null) input.location = location || undefined;
      if (type) input.type = type;
      if (direction) input.direction = direction;
      if (capacity) input.capacity = Number(capacity);

      await updateCheckpoint(id, input as any, ctx);
      return data({ success: true });
    }

    if (_action === "delete") {
      const id = formData.get("id") as string;
      if (!id) return data({ error: "Checkpoint ID is required" }, { status: 400 });
      await deleteCheckpoint(id, ctx);
      return data({ success: true });
    }

    if (_action === "toggle") {
      const id = formData.get("id") as string;
      if (!id) return data({ error: "Checkpoint ID is required" }, { status: 400 });
      await toggleCheckpoint(id, ctx);
      return data({ success: true });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof CheckpointError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

export default function CheckpointsPage() {
  const { event, checkpoints } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Checkpoints</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage scanning checkpoints for {event.name}.
          </p>
        </div>
        <CreateCheckpointDialog eventId={event.id} />
      </div>

      <Separator />

      {checkpoints.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No checkpoints configured yet. Create one to enable badge scanning.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Checkpoints</CardTitle>
            <CardDescription>
              {checkpoints.length} checkpoint{checkpoints.length !== 1 ? "s" : ""} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Location</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 font-medium">Direction</th>
                    <th className="pb-2 pr-4 font-medium">Capacity</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {checkpoints.map((cp: any) => (
                    <CheckpointRow key={cp.id} checkpoint={cp} />
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

function CreateCheckpointDialog({ eventId }: { eventId: string }) {
  const fetcher = useFetcher();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Checkpoint</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Checkpoint</DialogTitle>
          <DialogDescription>Add a new scanning checkpoint for this event.</DialogDescription>
        </DialogHeader>
        <fetcher.Form method="POST" onSubmit={() => setOpen(false)}>
          <input type="hidden" name="_action" value="create" />
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Main Entrance" required />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="Building A, Ground Floor" />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <NativeSelect id="type" name="type" required>
                {CHECKPOINT_TYPES.map((t) => (
                  <NativeSelectOption key={t} value={t}>
                    {t.replace("-", " ")}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="direction">Direction</Label>
              <NativeSelect id="direction" name="direction" required>
                {CHECKPOINT_DIRECTIONS.map((d) => (
                  <NativeSelectOption key={d} value={d}>
                    {d}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="capacity">Capacity (optional)</Label>
              <Input id="capacity" name="capacity" type="number" min="1" placeholder="100" />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={fetcher.state !== "idle"}>
              {fetcher.state !== "idle" ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}

function EditCheckpointDialog({
  checkpoint,
  open,
  onOpenChange,
}: {
  checkpoint: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fetcher = useFetcher();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Checkpoint</DialogTitle>
          <DialogDescription>Update checkpoint configuration.</DialogDescription>
        </DialogHeader>
        <fetcher.Form method="POST" onSubmit={() => onOpenChange(false)}>
          <input type="hidden" name="_action" value="update" />
          <input type="hidden" name="id" value={checkpoint.id} />
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" name="name" defaultValue={checkpoint.name} required />
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input id="edit-location" name="location" defaultValue={checkpoint.location ?? ""} />
            </div>
            <div>
              <Label htmlFor="edit-type">Type</Label>
              <NativeSelect id="edit-type" name="type" defaultValue={checkpoint.type}>
                {CHECKPOINT_TYPES.map((t) => (
                  <NativeSelectOption key={t} value={t}>
                    {t.replace("-", " ")}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="edit-direction">Direction</Label>
              <NativeSelect
                id="edit-direction"
                name="direction"
                defaultValue={checkpoint.direction}
              >
                {CHECKPOINT_DIRECTIONS.map((d) => (
                  <NativeSelectOption key={d} value={d}>
                    {d}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="edit-capacity">Capacity (optional)</Label>
              <Input
                id="edit-capacity"
                name="capacity"
                type="number"
                min="1"
                defaultValue={checkpoint.capacity ?? ""}
              />
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

function CheckpointRow({ checkpoint }: { checkpoint: any }) {
  const toggleFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <tr>
      <td className="py-3 pr-4 font-medium">{checkpoint.name}</td>
      <td className="py-3 pr-4 text-muted-foreground">{checkpoint.location ?? "—"}</td>
      <td className="py-3 pr-4">
        <Badge variant="secondary">{checkpoint.type}</Badge>
      </td>
      <td className="py-3 pr-4">
        <Badge variant="outline">{checkpoint.direction}</Badge>
      </td>
      <td className="py-3 pr-4 text-muted-foreground">{checkpoint.capacity ?? "—"}</td>
      <td className="py-3 pr-4">
        <Badge variant={checkpoint.isActive ? "default" : "secondary"}>
          {checkpoint.isActive ? "Active" : "Inactive"}
        </Badge>
      </td>
      <td className="py-3">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={toggleFetcher.state !== "idle"}
            onClick={() => {
              toggleFetcher.submit({ _action: "toggle", id: checkpoint.id }, { method: "POST" });
            }}
          >
            {checkpoint.isActive ? "Disable" : "Enable"}
          </Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Checkpoint</DialogTitle>
                <DialogDescription>
                  This will permanently delete the checkpoint "{checkpoint.name}" and all associated
                  access logs. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteFetcher.submit(
                      { _action: "delete", id: checkpoint.id },
                      { method: "POST" },
                    );
                    setDeleteOpen(false);
                  }}
                >
                  Delete Checkpoint
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <EditCheckpointDialog checkpoint={checkpoint} open={editOpen} onOpenChange={setEditOpen} />
      </td>
    </tr>
  );
}
