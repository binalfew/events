import { useState } from "react";
import {
  data,
  useLoaderData,
  useActionData,
  Form,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { Badge } from "~/components/ui/badge";

export const handle = { breadcrumb: "Surveys" };

// ─── Loader ──────────────────────────────────────────────

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { requirePermission } = await import("~/lib/require-auth.server");
  const { isFeatureEnabled, FEATURE_FLAG_KEYS } = await import("~/lib/feature-flags.server");
  const { listSurveys } = await import("~/services/surveys.server");

  const { user } = await requirePermission(request, "survey", "manage");
  const tenantId = user.tenantId;
  const eventId = params.eventId!;

  const enabled = await isFeatureEnabled(FEATURE_FLAG_KEYS.SURVEYS);
  if (!enabled) throw data("Feature not enabled", { status: 404 });

  const surveys = await listSurveys(eventId, tenantId);

  // Load form templates for survey creation
  const { prisma } = await import("~/lib/db.server");
  const formTemplates = await prisma.formTemplate.findMany({
    where: { eventId, tenantId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return {
    surveys: surveys.map((s: any) => ({
      ...s,
      opensAt: s.opensAt?.toISOString?.() ?? null,
      closesAt: s.closesAt?.toISOString?.() ?? null,
      createdAt: s.createdAt?.toISOString?.() ?? s.createdAt,
      responseCount: s._count?.responses ?? 0,
    })),
    formTemplates,
    eventId,
  };
}

// ─── Action ──────────────────────────────────────────────

export async function action({ request, params }: ActionFunctionArgs) {
  const { requirePermission } = await import("~/lib/require-auth.server");
  const { user } = await requirePermission(request, "survey", "manage");
  const tenantId = user.tenantId;
  const eventId = params.eventId!;

  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  const ctx = {
    userId: user.id,
    tenantId,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };

  try {
    if (_action === "create_survey") {
      const { createSurveySchema } = await import("~/lib/schemas/survey");
      const { createSurvey } = await import("~/services/surveys.server");

      const parsed = createSurveySchema.parse({
        eventId,
        title: formData.get("title"),
        description: formData.get("description"),
        formTemplateId: formData.get("formTemplateId"),
        opensAt: formData.get("opensAt"),
        closesAt: formData.get("closesAt"),
        isAnonymous: formData.get("isAnonymous"),
      });

      await createSurvey(parsed, ctx);
      return { success: true, message: "Survey created" };
    }

    if (_action === "publish") {
      const { publishSurvey } = await import("~/services/surveys.server");
      const surveyId = formData.get("surveyId") as string;
      await publishSurvey(surveyId, ctx);
      return { success: true, message: "Survey published" };
    }

    if (_action === "close") {
      const { closeSurvey } = await import("~/services/surveys.server");
      const surveyId = formData.get("surveyId") as string;
      await closeSurvey(surveyId, ctx);
      return { success: true, message: "Survey closed" };
    }

    if (_action === "archive") {
      const { archiveSurvey } = await import("~/services/surveys.server");
      const surveyId = formData.get("surveyId") as string;
      await archiveSurvey(surveyId, ctx);
      return { success: true, message: "Survey archived" };
    }

    if (_action === "submit_response") {
      const { submitResponseSchema } = await import("~/lib/schemas/survey");
      const { submitResponse } = await import("~/services/surveys.server");

      const parsed = submitResponseSchema.parse({
        surveyId: formData.get("surveyId"),
        participantId: formData.get("participantId"),
        answers: formData.get("answers"),
      });

      await submitResponse(parsed, ctx);
      return { success: true, message: "Response submitted" };
    }

    if (_action === "export") {
      const { exportSurveyResults } = await import("~/services/surveys.server");
      const surveyId = formData.get("surveyId") as string;
      const result = await exportSurveyResults(surveyId, tenantId);
      return {
        success: true,
        message: `Exported ${result.totalRows} responses`,
        csv: result.csv,
        filename: result.filename,
      };
    }

    return { error: "Unknown action" };
  } catch (err: any) {
    if (err.name === "SurveyError") {
      return data({ error: err.message }, { status: err.status });
    }
    if (err.issues) {
      return data({ error: err.issues.map((i: any) => i.message).join(", ") }, { status: 400 });
    }
    throw err;
  }
}

// ─── UI ──────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-green-100 text-green-800",
  CLOSED: "bg-yellow-100 text-yellow-800",
  ARCHIVED: "bg-blue-100 text-blue-800",
};

export default function SurveysPage() {
  const { surveys, formTemplates, eventId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Surveys & Feedback</h2>
          <p className="text-muted-foreground">Create and manage post-event surveys</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Cancel" : "Create Survey"}
        </Button>
      </div>

      {actionData && "error" in actionData && (
        <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
          {actionData.error}
        </div>
      )}
      {actionData && "success" in actionData && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          {actionData.message}
        </div>
      )}

      {/* Create Survey Form */}
      {showCreateForm && (
        <Form method="post" className="rounded-lg border p-4 space-y-4">
          <input type="hidden" name="_action" value="create_survey" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="survey-title">Title</Label>
              <Input
                id="survey-title"
                name="title"
                required
                placeholder="e.g., Post-Event Feedback"
              />
            </div>
            <div>
              <Label htmlFor="survey-template">Form Template (optional)</Label>
              <NativeSelect id="survey-template" name="formTemplateId">
                <NativeSelectOption value="">No template</NativeSelectOption>
                {formTemplates.map((t: any) => (
                  <NativeSelectOption key={t.id} value={t.id}>
                    {t.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="survey-desc">Description</Label>
              <Textarea
                id="survey-desc"
                name="description"
                placeholder="What is this survey about?"
              />
            </div>
            <div>
              <Label htmlFor="survey-opens">Opens At</Label>
              <Input id="survey-opens" name="opensAt" type="datetime-local" />
            </div>
            <div>
              <Label htmlFor="survey-closes">Closes At</Label>
              <Input id="survey-closes" name="closesAt" type="datetime-local" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="survey-anon" name="isAnonymous" />
              <Label htmlFor="survey-anon">Anonymous responses</Label>
            </div>
          </div>
          <Button type="submit">Create Survey</Button>
        </Form>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total Surveys</p>
          <p className="text-2xl font-bold">{surveys.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Published</p>
          <p className="text-2xl font-bold text-green-600">
            {surveys.filter((s: any) => s.status === "PUBLISHED").length}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total Responses</p>
          <p className="text-2xl font-bold">
            {surveys.reduce((sum: number, s: any) => sum + s.responseCount, 0)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Draft</p>
          <p className="text-2xl font-bold text-gray-600">
            {surveys.filter((s: any) => s.status === "DRAFT").length}
          </p>
        </div>
      </div>

      {/* Survey List */}
      {surveys.length === 0 ? (
        <p className="text-muted-foreground text-sm">No surveys created yet.</p>
      ) : (
        <div className="space-y-4">
          {surveys.map((survey: any) => (
            <div key={survey.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{survey.title}</h3>
                    <Badge className={STATUS_COLORS[survey.status] ?? "bg-gray-100 text-gray-800"}>
                      {survey.status}
                    </Badge>
                  </div>
                  {survey.description && (
                    <p className="text-muted-foreground mt-1 text-sm">{survey.description}</p>
                  )}
                  <div className="text-muted-foreground mt-2 flex gap-4 text-xs">
                    {survey.formTemplate && <span>Template: {survey.formTemplate.name}</span>}
                    <span>Responses: {survey.responseCount}</span>
                    {survey.isAnonymous && <span>Anonymous</span>}
                    {survey.opensAt && (
                      <span>Opens: {new Date(survey.opensAt).toLocaleDateString()}</span>
                    )}
                    {survey.closesAt && (
                      <span>Closes: {new Date(survey.closesAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {survey.status === "DRAFT" && (
                    <Form method="post" className="inline">
                      <input type="hidden" name="_action" value="publish" />
                      <input type="hidden" name="surveyId" value={survey.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Publish
                      </Button>
                    </Form>
                  )}
                  {survey.status === "PUBLISHED" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setShowResponseForm(showResponseForm === survey.id ? null : survey.id)
                        }
                      >
                        Add Response
                      </Button>
                      <Form method="post" className="inline">
                        <input type="hidden" name="_action" value="close" />
                        <input type="hidden" name="surveyId" value={survey.id} />
                        <Button type="submit" size="sm" variant="outline">
                          Close
                        </Button>
                      </Form>
                    </>
                  )}
                  {survey.status === "CLOSED" && (
                    <Form method="post" className="inline">
                      <input type="hidden" name="_action" value="archive" />
                      <input type="hidden" name="surveyId" value={survey.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Archive
                      </Button>
                    </Form>
                  )}
                  {survey.responseCount > 0 && (
                    <Form method="post" className="inline">
                      <input type="hidden" name="_action" value="export" />
                      <input type="hidden" name="surveyId" value={survey.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Export CSV
                      </Button>
                    </Form>
                  )}
                </div>
              </div>

              {/* Inline Response Form */}
              {showResponseForm === survey.id && (
                <Form method="post" className="mt-4 rounded border bg-gray-50 p-3 space-y-3">
                  <input type="hidden" name="_action" value="submit_response" />
                  <input type="hidden" name="surveyId" value={survey.id} />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`resp-part-${survey.id}`}>
                        Participant ID (optional for anonymous)
                      </Label>
                      <Input
                        id={`resp-part-${survey.id}`}
                        name="participantId"
                        placeholder="Participant CUID"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor={`resp-answers-${survey.id}`}>Answers (JSON)</Label>
                      <Textarea
                        id={`resp-answers-${survey.id}`}
                        name="answers"
                        required
                        placeholder='{"rating": 5, "feedback": "Great event!"}'
                        rows={3}
                      />
                    </div>
                  </div>
                  <Button type="submit" size="sm">
                    Submit Response
                  </Button>
                </Form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
