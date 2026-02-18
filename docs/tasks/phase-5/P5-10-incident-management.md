# P5-10: Incident Management

| Field                  | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| **Task ID**            | P5-10                                                    |
| **Phase**              | 5 — Event Operations & Logistics                         |
| **Category**           | Safety                                                   |
| **Suggested Assignee** | Backend Developer                                        |
| **Depends On**         | P5-00 (Foundation Models)                                |
| **Blocks**             | P5-11 (Live Event Command Center)                        |
| **Estimated Effort**   | 4 days                                                   |
| **Module References**  | [Module 10](../../modules/10-EVENT-OPERATIONS-CENTER.md) |

---

## Context

Event operations require a structured incident management system for logging security issues, medical emergencies, technical failures, and other disruptions. Incidents must be categorized by severity, assigned to responders, escalated when unresolved within SLA windows, and tracked through resolution. The `Incident`, `IncidentUpdate`, and `IncidentEscalation` models were created in P5-00.

---

## Deliverables

### 1. Incident Service

Create `app/services/incidents.server.ts`:

- `reportIncident(input, ctx)` — Create incident (title, description, severity, category, location, reporter)
- `listIncidents(eventId, tenantId, filters?)` — Filterable list (severity, status, category, date range)
- `getIncident(id, tenantId)` — Full incident with updates and escalation history
- `assignIncident(incidentId, assigneeId, ctx)` — Assign to responder
- `addUpdate(incidentId, input, ctx)` — Add status update/note to incident timeline
- `escalateIncident(incidentId, input, ctx)` — Escalate with reason and new assignee
- `resolveIncident(incidentId, resolution, ctx)` — Mark resolved with resolution summary
- `closeIncident(incidentId, ctx)` — Close after resolution verification
- `reopenIncident(incidentId, reason, ctx)` — Reopen closed incident
- `getIncidentStats(eventId, tenantId)` — Open/resolved/escalated counts, avg resolution time, by severity
- `checkOverdueIncidents(eventId, tenantId)` — Find incidents exceeding SLA by severity level

### 2. Incident Escalation Background Job

Create `server/incident-escalation-job.js`:

- Runs every 5 minutes
- Auto-escalates incidents exceeding SLA thresholds:
  - CRITICAL: 15 minutes
  - HIGH: 1 hour
  - MEDIUM: 4 hours
  - LOW: 24 hours
- Sends notification to escalation contacts

### 3. Zod Schemas

Create `app/lib/schemas/incident.ts`

### 4. Admin UI Route

Create `app/routes/admin/events/$eventId/incidents.tsx`:

- Incident list with severity badges, status filters, assignment
- Incident detail with timeline of updates and escalations
- Stats dashboard with severity breakdown
- Feature flag: `FF_INCIDENT_MANAGEMENT`

### 5. Tests

Create `app/services/__tests__/incidents.server.test.ts` — ≥10 test cases

---

## Acceptance Criteria

- [ ] Incident lifecycle: REPORTED → INVESTIGATING → ESCALATED → RESOLVED → CLOSED
- [ ] Severity levels: LOW, MEDIUM, HIGH, CRITICAL with SLA thresholds
- [ ] Assignment to responders with notification
- [ ] Timeline of updates and escalation history
- [ ] Auto-escalation background job for overdue incidents
- [ ] Stats dashboard with resolution time metrics
- [ ] Feature flag `FF_INCIDENT_MANAGEMENT` gates all functionality
- [ ] Event card shows "Incidents" link in Ops section
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (≥10 new test cases)
