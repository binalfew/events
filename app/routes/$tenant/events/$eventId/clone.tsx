import { data, useFetcher, useLoaderData } from "react-router";
import { useState } from "react";
import { requirePermission } from "~/lib/require-auth.server";
import { isFeatureEnabled, FEATURE_FLAG_KEYS } from "~/lib/feature-flags.server";
import { prisma } from "~/lib/db.server";
import { startCloneOperation, listSeries, EventCloneError } from "~/services/event-clone.server";
import { cloneOptionsSchema } from "~/lib/schemas/event-clone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { DatePicker } from "~/components/ui/date-picker";
import { useBasePrefix } from "~/hooks/use-base-prefix";
import type { Route } from "./+types/clone";

export const handle = { breadcrumb: "Clone" };

// ─── Loader ───────────────────────────────────────────────

export async function loader({ request, params }: Route.LoaderArgs) {
  const { user, roles } = await requirePermission(request, "event-clone", "execute");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.EVENT_CLONE, {
    tenantId,
    roles,
    userId: user.id,
  });
  if (!enabled) {
    throw data({ error: "Event cloning is not enabled" }, { status: 404 });
  }

  const eventId = params.eventId;
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
    include: {
      _count: {
        select: {
          participantTypes: true,
          workflows: true,
          fieldDefinitions: true,
          formTemplates: true,
          delegationQuotas: true,
          checkpoints: true,
        },
      },
    },
  });
  if (!event) {
    throw data({ error: "Event not found" }, { status: 404 });
  }

  const series = await listSeries(tenantId);

  return { event, series };
}

// ─── Action ───────────────────────────────────────────────

export async function action({ request, params }: Route.ActionArgs) {
  const { user, roles } = await requirePermission(request, "event-clone", "execute");
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw data({ error: "User is not associated with a tenant" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.EVENT_CLONE, {
    tenantId,
    roles,
    userId: user.id,
  });
  if (!enabled) {
    throw data({ error: "Event cloning is not enabled" }, { status: 404 });
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
    if (_action === "start_clone") {
      const options = {
        sourceEventId: params.eventId,
        targetEventName: formData.get("targetEventName") as string,
        targetStartDate: formData.get("targetStartDate") as string,
        targetEndDate: formData.get("targetEndDate") as string,
        elements: {
          workflows: formData.get("el_workflows") === "on",
          forms: formData.get("el_forms") === "on",
          participantTypes: formData.get("el_participantTypes") === "on",
          fieldDefinitions: formData.get("el_fieldDefinitions") === "on",
          delegations: formData.get("el_delegations") === "on",
          checkpoints: formData.get("el_checkpoints") === "on",
        },
        seriesId: (formData.get("seriesId") as string) || undefined,
        editionNumber: formData.get("editionNumber")
          ? Number(formData.get("editionNumber"))
          : undefined,
      };

      const parsed = cloneOptionsSchema.safeParse(options);
      if (!parsed.success) {
        return data({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      const result = await startCloneOperation(parsed.data, ctx);
      return data({
        success: true,
        targetEventId: result.targetEventId,
        elementsCopied: result.elementsCopied,
      });
    }

    return data({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof EventCloneError) {
      return data({ error: error.message }, { status: error.status });
    }
    return data({ error: error.message ?? "Clone operation failed" }, { status: 500 });
  }
}

// ─── Component ────────────────────────────────────────────

type WizardStep = "source" | "config" | "elements" | "result";

export default function CloneEventPage() {
  const { event, series } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<any>();
  const basePrefix = useBasePrefix();
  const [step, setStep] = useState<WizardStep>("source");

  // Form state
  const [targetName, setTargetName] = useState(`${event.name} (Copy)`);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [seriesId, setSeriesId] = useState("");
  const [editionNumber, setEditionNumber] = useState("");

  // Element toggles
  const [elements, setElements] = useState({
    participantTypes: true,
    fieldDefinitions: true,
    workflows: true,
    forms: true,
    delegations: true,
    checkpoints: true,
  });

  const toggleElement = (key: keyof typeof elements) => {
    setElements((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = () => {
    const allOn = Object.values(elements).every(Boolean);
    const newVal = !allOn;
    setElements({
      participantTypes: newVal,
      fieldDefinitions: newVal,
      workflows: newVal,
      forms: newVal,
      delegations: newVal,
      checkpoints: newVal,
    });
  };

  // Handle result from fetcher
  const fetcherData = fetcher.data;
  if (fetcherData?.success && step !== "result") {
    setStep("result");
  }

  const counts = event._count;

  const elementOptions = [
    {
      key: "participantTypes" as const,
      label: "Participant Types",
      count: counts.participantTypes,
    },
    {
      key: "fieldDefinitions" as const,
      label: "Field Definitions",
      count: counts.fieldDefinitions,
    },
    { key: "workflows" as const, label: "Workflows", count: counts.workflows },
    { key: "forms" as const, label: "Forms", count: counts.formTemplates },
    { key: "delegations" as const, label: "Delegation Quotas", count: counts.delegationQuotas },
    { key: "checkpoints" as const, label: "Checkpoints", count: counts.checkpoints },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Clone Event</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new event based on the configuration of "{event.name}".
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 text-sm">
        {(["source", "config", "elements", "result"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground">→</span>}
            <span className={step === s ? "font-semibold text-primary" : "text-muted-foreground"}>
              {i + 1}.{" "}
              {s === "source"
                ? "Source"
                : s === "config"
                  ? "Configure"
                  : s === "elements"
                    ? "Elements"
                    : "Result"}
            </span>
          </div>
        ))}
      </div>

      <Separator />

      {/* Step 1: Source Summary */}
      {step === "source" && (
        <Card>
          <CardHeader>
            <CardTitle>Source Event</CardTitle>
            <CardDescription>Review the source event before cloning.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <span className="ml-2 font-medium">{event.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="secondary" className="ml-2">
                  {event.status}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Start:</span>
                <span className="ml-2">{new Date(event.startDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">End:</span>
                <span className="ml-2">{new Date(event.endDate).toLocaleDateString()}</span>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Available Elements</h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                {elementOptions.map((el) => (
                  <div
                    key={el.key}
                    className="flex items-center justify-between rounded border p-2"
                  >
                    <span>{el.label}</span>
                    <Badge variant="outline">{el.count}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep("config")}>Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Target Configuration */}
      {step === "config" && (
        <Card>
          <CardHeader>
            <CardTitle>Target Configuration</CardTitle>
            <CardDescription>Configure the new event details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="targetEventName">Event Name</Label>
              <Input
                id="targetEventName"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Select start date"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <DatePicker value={endDate} onChange={setEndDate} placeholder="Select end date" />
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="seriesId">Event Series (Optional)</Label>
              <NativeSelect
                id="seriesId"
                value={seriesId}
                onChange={(e) => setSeriesId(e.target.value)}
              >
                <NativeSelectOption value="">— No series —</NativeSelectOption>
                {series.map((s: any) => (
                  <NativeSelectOption key={s.id} value={s.id}>
                    {s.name} ({s._count.editions} editions)
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            {seriesId && (
              <div>
                <Label htmlFor="editionNumber">Edition Number</Label>
                <Input
                  id="editionNumber"
                  type="number"
                  min="1"
                  value={editionNumber}
                  onChange={(e) => setEditionNumber(e.target.value)}
                  placeholder="e.g., 35"
                />
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("source")}>
                Back
              </Button>
              <Button
                onClick={() => setStep("elements")}
                disabled={!targetName || !startDate || !endDate}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Element Selection */}
      {step === "elements" && (
        <Card>
          <CardHeader>
            <CardTitle>Select Elements to Clone</CardTitle>
            <CardDescription>
              Choose which configuration elements to copy to the new event.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Forms may reference Field Definitions and Participant Types.
              </span>
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {Object.values(elements).every(Boolean) ? "Deselect All" : "Select All"}
              </Button>
            </div>

            <div className="space-y-2">
              {elementOptions.map((el) => (
                <label
                  key={el.key}
                  className="flex items-center justify-between rounded border p-3 cursor-pointer hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={elements[el.key]}
                      onChange={() => toggleElement(el.key)}
                      className="size-4 rounded border-input"
                    />
                    <span className="text-sm font-medium">{el.label}</span>
                  </div>
                  <Badge variant="outline">{el.count}</Badge>
                </label>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("config")}>
                Back
              </Button>
              <fetcher.Form method="POST">
                <input type="hidden" name="_action" value="start_clone" />
                <input type="hidden" name="targetEventName" value={targetName} />
                <input
                  type="hidden"
                  name="targetStartDate"
                  value={startDate ? startDate.toISOString().split("T")[0] : ""}
                />
                <input
                  type="hidden"
                  name="targetEndDate"
                  value={endDate ? endDate.toISOString().split("T")[0] : ""}
                />
                {elements.participantTypes && (
                  <input type="hidden" name="el_participantTypes" value="on" />
                )}
                {elements.fieldDefinitions && (
                  <input type="hidden" name="el_fieldDefinitions" value="on" />
                )}
                {elements.workflows && <input type="hidden" name="el_workflows" value="on" />}
                {elements.forms && <input type="hidden" name="el_forms" value="on" />}
                {elements.delegations && <input type="hidden" name="el_delegations" value="on" />}
                {elements.checkpoints && <input type="hidden" name="el_checkpoints" value="on" />}
                {seriesId && <input type="hidden" name="seriesId" value={seriesId} />}
                {seriesId && editionNumber && (
                  <input type="hidden" name="editionNumber" value={editionNumber} />
                )}
                <Button
                  type="submit"
                  disabled={fetcher.state !== "idle" || !Object.values(elements).some(Boolean)}
                >
                  {fetcher.state !== "idle" ? "Cloning..." : "Clone Event"}
                </Button>
              </fetcher.Form>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Result */}
      {step === "result" && (
        <Card>
          <CardHeader>
            <CardTitle>{fetcherData?.success ? "Clone Successful" : "Clone Failed"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fetcherData?.success ? (
              <>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200 dark:border-green-800">
                  Event cloned successfully.
                </div>

                {fetcherData.elementsCopied && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Elements Copied</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {Object.entries(fetcherData.elementsCopied as Record<string, number>).map(
                        ([key, count]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between rounded border p-2"
                          >
                            <span className="capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            <Badge variant="outline">{count as number}</Badge>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button asChild>
                    <a href={`${basePrefix}/events/${fetcherData.targetEventId}/fields`}>
                      View New Event
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`${basePrefix}/events`}>Back to Events</a>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200 dark:border-red-800">
                  {fetcherData?.error ?? "An unknown error occurred."}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("elements")}>
                    Try Again
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`${basePrefix}/events`}>Back to Events</a>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
