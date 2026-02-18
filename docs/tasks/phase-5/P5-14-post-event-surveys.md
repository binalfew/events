# P5-14: Post-Event Surveys

| Field                  | Value                                                  |
| ---------------------- | ------------------------------------------------------ |
| **Task ID**            | P5-14                                                  |
| **Phase**              | 5 — Event Operations & Logistics                       |
| **Category**           | Feedback                                               |
| **Suggested Assignee** | Full-stack Developer                                   |
| **Depends On**         | P5-00 (Foundation Models)                              |
| **Blocks**             | —                                                      |
| **Estimated Effort**   | 4 days                                                 |
| **Module References**  | [Module 14](../../modules/14-CONTENT-AND-DOCUMENTS.md) |

---

## Context

Post-event feedback is critical for improving future editions. The survey system reuses the existing form designer infrastructure (FormTemplate, FieldDefinition) to build surveys with rating scales, multiple choice, and open-ended questions. Surveys can target specific participant types and have configurable open/close windows. The `Survey` and `SurveyResponse` models were created in P5-00.

---

## Deliverables

### 1. Survey Service

Create `app/services/surveys.server.ts`:

- `createSurvey(input, ctx)` — Create survey linked to a form template (name, description, target audience, open/close dates)
- `listSurveys(eventId, tenantId)` — Surveys with response counts and completion rates
- `getSurvey(id, tenantId)` — Survey with form template and response summary
- `publishSurvey(surveyId, ctx)` — Transition from DRAFT to PUBLISHED
- `closeSurvey(surveyId, ctx)` — Transition from PUBLISHED to CLOSED
- `submitResponse(surveyId, participantId, responses, ctx)` — Submit survey response (validates against form template)
- `getResponses(surveyId, tenantId, filters?)` — Paginated response list with participant info
- `getSurveyAnalytics(surveyId, tenantId)` — Aggregated analytics: response rate, rating averages, word clouds, question-by-question breakdown
- `exportSurveyResults(surveyId, tenantId, format)` — Export responses as CSV/XLSX
- `sendSurveyInvitations(surveyId, ctx)` — Broadcast survey link to target audience via communication hub

### 2. Zod Schemas

Create `app/lib/schemas/survey.ts`

### 3. Admin UI Route

Create `app/routes/admin/events/$eventId/surveys.tsx`:

- Survey list with status badges and response rates
- Survey creation linking to form templates
- Response viewer with analytics dashboard
- Export button

### 4. Tests

Create `app/services/__tests__/surveys.server.test.ts` — ≥8 test cases

---

## Acceptance Criteria

- [ ] Survey creation linked to form templates (reuses form designer)
- [ ] Survey lifecycle: DRAFT → PUBLISHED → CLOSED → ARCHIVED
- [ ] Response submission validates against form template schema
- [ ] Duplicate response prevention (one per participant per survey)
- [ ] Analytics with response rate, rating averages, question breakdown
- [ ] Survey results exportable as CSV/XLSX
- [ ] Survey invitations via communication hub
- [ ] Event card shows "Surveys" link in Comms section
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (≥8 new test cases)
