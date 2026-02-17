import { data, Form, useLoaderData, useActionData, redirect } from "react-router";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { acceptInvite, DelegationError } from "~/services/delegation.server";
import { prisma } from "~/lib/db.server";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Route } from "./+types/accept";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    throw data({ error: "Missing invitation token" }, { status: 400 });
  }

  const invite = await prisma.delegationInvite.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      status: true,
      expiresAt: true,
      quota: {
        select: {
          organizationId: true,
          event: { select: { name: true } },
        },
      },
    },
  });

  if (!invite) {
    return { found: false as const };
  }

  return {
    found: true as const,
    email: invite.email,
    status: invite.status,
    eventName: invite.quota.event.name,
    organizationId: invite.quota.organizationId,
    expired: invite.expiresAt < new Date(),
    token,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const token = formData.get("token") as string;

  if (!token) {
    return data({ error: "Missing token" }, { status: 400 });
  }

  try {
    const result = await acceptInvite(token);
    if (result.alreadyAccepted) {
      return { success: true, alreadyAccepted: true };
    }
    return { success: true, alreadyAccepted: false };
  } catch (error) {
    if (error instanceof DelegationError) {
      return data({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export default function AcceptDelegationPage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  if (!loaderData.found) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="mx-auto mb-3 size-12 text-destructive" />
            <h2 className="text-lg font-semibold">Invalid Invitation</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This invitation link is not valid. Please check the link or contact the person who
              sent it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { email, status, eventName, organizationId, expired, token } = loaderData;

  // Already handled by action
  if (actionData && "success" in actionData && actionData.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 size-12 text-green-600" />
            <h2 className="text-lg font-semibold">
              {actionData.alreadyAccepted ? "Already Accepted" : "Invitation Accepted"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {actionData.alreadyAccepted
                ? "You have already accepted this invitation."
                : `You are now registered as a delegate for ${eventName}.`}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "ACCEPTED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 size-12 text-green-600" />
            <h2 className="text-lg font-semibold">Already Accepted</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This invitation has already been accepted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "CANCELLED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="mx-auto mb-3 size-12 text-destructive" />
            <h2 className="text-lg font-semibold">Invitation Cancelled</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This invitation has been cancelled by the organizer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "EXPIRED" || expired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Clock className="mx-auto mb-3 size-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Invitation Expired</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This invitation has expired. Please contact the organizer for a new invitation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Delegation Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-4 text-sm">
            <p>
              <span className="font-medium">Event:</span> {eventName}
            </p>
            <p>
              <span className="font-medium">Organization:</span> {organizationId}
            </p>
            <p>
              <span className="font-medium">Invited as:</span> {email}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            By accepting this invitation, you will be registered as a delegate for the event above.
          </p>

          {"error" in (actionData ?? {}) && (
            <p className="text-sm text-destructive">{(actionData as { error: string }).error}</p>
          )}

          <Form method="post">
            <input type="hidden" name="token" value={token} />
            <Button type="submit" className="w-full">
              Accept Invitation
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
