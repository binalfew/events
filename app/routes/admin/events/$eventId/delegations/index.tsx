import { data, Form, useLoaderData, redirect } from "react-router";
import { Plus, Trash2, Send, RotateCcw, XCircle, Building2, Users } from "lucide-react";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { prisma } from "~/lib/db.server";
import {
  upsertQuota,
  deleteQuota,
  sendInvite,
  cancelInvite,
  resendInvite,
  DelegationError,
} from "~/services/delegation.server";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { EmptyState } from "~/components/ui/empty-state";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Route } from "./+types/index";

export const handle = { breadcrumb: "Delegations" };

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user, roles } = await requirePermission(request, "delegation", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.DELEGATION_PORTAL, {
    tenantId,
    roles,
    userId: user.id,
  });
  if (!enabled) {
    throw data({ error: "Delegation portal is not enabled" }, { status: 404 });
  }

  const eventId = params.eventId;
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
    select: { id: true, name: true },
  });
  if (!event) {
    throw data({ error: "Event not found" }, { status: 404 });
  }

  const quotas = await prisma.delegationQuota.findMany({
    where: { tenantId, eventId },
    include: {
      invites: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { organizationId: "asc" },
  });

  return { event, quotas, tenantId };
}

export async function action({ request, params }: Route.ActionArgs) {
  const { user, roles } = await requirePermission(request, "delegation", "manage");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const eventId = params.eventId;
  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  try {
    switch (_action) {
      case "upsert-quota": {
        const organizationId = formData.get("organizationId") as string;
        const maxParticipants = Number(formData.get("maxParticipants"));
        if (!organizationId || !maxParticipants || maxParticipants < 1) {
          return data({ error: "Organization and max participants are required" }, { status: 400 });
        }
        await upsertQuota(tenantId, eventId, organizationId, maxParticipants);
        break;
      }

      case "delete-quota": {
        const quotaId = formData.get("quotaId") as string;
        await deleteQuota(quotaId);
        break;
      }

      case "send-invite": {
        const quotaId = formData.get("quotaId") as string;
        const email = formData.get("email") as string;
        if (!email) {
          return data({ error: "Email is required" }, { status: 400 });
        }
        await sendInvite({ quotaId, email, invitedBy: user.id });
        break;
      }

      case "cancel-invite": {
        const inviteId = formData.get("inviteId") as string;
        await cancelInvite(inviteId);
        break;
      }

      case "resend-invite": {
        const inviteId = formData.get("inviteId") as string;
        await resendInvite(inviteId);
        break;
      }

      default:
        return data({ error: "Unknown action" }, { status: 400 });
    }

    return redirect(`/admin/events/${eventId}/delegations`);
  } catch (error) {
    if (error instanceof DelegationError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  ACCEPTED: "default",
  CANCELLED: "destructive",
  EXPIRED: "secondary",
};

export default function DelegationsPage() {
  const { event, quotas } = useLoaderData<typeof loader>();

  const totalQuota = quotas.reduce((sum, q) => sum + q.maxParticipants, 0);
  const totalUsed = quotas.reduce((sum, q) => sum + q.usedCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Delegation Quotas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage delegation quotas and invitations for {event.name}. {totalUsed}/{totalQuota}{" "}
            slots used across {quotas.length} organization
            {quotas.length !== 1 ? "s" : ""}.
          </p>
        </div>
      </div>

      <Separator />

      {/* Add / Update Quota Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="size-4" />
            Add or Update Quota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="flex flex-wrap items-end gap-4">
            <input type="hidden" name="_action" value="upsert-quota" />
            <div>
              <label
                htmlFor="organizationId"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Organization ID
              </label>
              <Input
                id="organizationId"
                name="organizationId"
                required
                placeholder="e.g. org-au-001"
                className="w-60"
              />
            </div>
            <div>
              <label
                htmlFor="maxParticipants"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Max Participants
              </label>
              <Input
                id="maxParticipants"
                name="maxParticipants"
                type="number"
                min={1}
                required
                placeholder="10"
                className="w-32"
              />
            </div>
            <Button type="submit" size="sm">
              Save Quota
            </Button>
          </Form>
        </CardContent>
      </Card>

      {/* Quotas List */}
      {quotas.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No delegation quotas"
          description="Add a quota for an organization to start managing delegations."
        />
      ) : (
        <div className="space-y-4">
          {quotas.map((quota) => (
            <Card key={quota.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="size-4" />
                    {quota.organizationId}
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="size-4" />
                      {quota.usedCount}/{quota.maxParticipants}
                    </div>
                    <Form method="post">
                      <input type="hidden" name="_action" value="delete-quota" />
                      <input type="hidden" name="quotaId" value={quota.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </Form>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Send invite form */}
                <Form method="post" className="flex items-end gap-3">
                  <input type="hidden" name="_action" value="send-invite" />
                  <input type="hidden" name="quotaId" value={quota.id} />
                  <div className="flex-1">
                    <label
                      htmlFor={`email-${quota.id}`}
                      className="mb-1 block text-xs font-medium text-muted-foreground"
                    >
                      Invite delegate by email
                    </label>
                    <Input
                      id={`email-${quota.id}`}
                      name="email"
                      type="email"
                      required
                      placeholder="delegate@example.com"
                    />
                  </div>
                  <Button type="submit" size="sm" variant="secondary">
                    <Send className="mr-1 size-3" />
                    Send Invite
                  </Button>
                </Form>

                {/* Invites list */}
                {quota.invites.length > 0 && (
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            Email
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            Status
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            Sent
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {quota.invites.map((invite) => (
                          <tr key={invite.id} className="border-b last:border-b-0">
                            <td className="px-3 py-2">{invite.email}</td>
                            <td className="px-3 py-2">
                              <Badge variant={STATUS_COLORS[invite.status] ?? "outline"}>
                                {invite.status}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {new Date(invite.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {invite.status === "PENDING" && (
                                <div className="flex items-center justify-end gap-1">
                                  <Form method="post" className="inline">
                                    <input type="hidden" name="_action" value="resend-invite" />
                                    <input type="hidden" name="inviteId" value={invite.id} />
                                    <Button type="submit" variant="ghost" size="sm">
                                      <RotateCcw className="size-3" />
                                    </Button>
                                  </Form>
                                  <Form method="post" className="inline">
                                    <input type="hidden" name="_action" value="cancel-invite" />
                                    <input type="hidden" name="inviteId" value={invite.id} />
                                    <Button
                                      type="submit"
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <XCircle className="size-3" />
                                    </Button>
                                  </Form>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
