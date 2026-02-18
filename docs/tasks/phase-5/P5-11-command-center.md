# P5-11: Live Event Command Center

| Field                  | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| **Task ID**            | P5-11                                                    |
| **Phase**              | 5 — Event Operations & Logistics                         |
| **Category**           | Operations                                               |
| **Suggested Assignee** | Senior Frontend Developer                                |
| **Depends On**         | P5-00 (Foundation Models), P5-10 (Incident Management)   |
| **Blocks**             | —                                                        |
| **Estimated Effort**   | 5 days                                                   |
| **Module References**  | [Module 10](../../modules/10-EVENT-OPERATIONS-CENTER.md) |

---

## Context

The command center is a multi-panel real-time dashboard for the operations room. It aggregates data from all operational modules (incidents, check-in, venue occupancy, transport, staff deployment) into a single view. Operations managers can configure which widgets to display and set up alert rules for threshold breaches. The `CommandCenterWidget` and `AlertRule` models were created in P5-00.

---

## Deliverables

### 1. Command Center Service

Create `app/services/command-center.server.ts`:

- `getCommandCenterData(eventId, tenantId)` — Aggregates data from all operational modules:
  - Registration stats (approved, pending, rejected counts)
  - Check-in stats (scanned today, occupancy by zone)
  - Incident summary (open by severity)
  - Transport status (active vehicles, upcoming transfers)
  - Staff deployment (on-duty count, zone coverage)
  - Queue status (waiting, average wait time)
- `createWidget(input, ctx)` — Configure dashboard widget (type, position, size, data source, refresh interval)
- `updateWidgetLayout(widgets, ctx)` — Save widget positions after drag-and-drop
- `createAlertRule(input, ctx)` — Define threshold alert (metric, operator, value, severity, recipients)
- `listAlertRules(eventId, tenantId)` — Active alert rules
- `evaluateAlerts(eventId, tenantId)` — Check all rules and fire notifications for breaches
- `getRecentAlerts(eventId, tenantId)` — Recently triggered alerts

### 2. Alert Evaluation Background Job

Optional: Hook into existing SLA check job or create dedicated `server/alert-evaluation-job.js`

### 3. Admin UI Route

Create `app/routes/admin/events/$eventId/command-center.tsx`:

- Multi-panel dashboard with configurable widgets
- Widget types: stat card, chart, list, map, timeline
- Real-time updates via SSE
- Alert banner for active threshold breaches
- Fullscreen mode for ops room display

### 4. Tests

Create `app/services/__tests__/command-center.server.test.ts` — ≥8 test cases

---

## Acceptance Criteria

- [ ] Command center aggregates data from all operational modules
- [ ] Configurable widget layout with drag-and-drop positioning
- [ ] Widget types: stat card, incident list, occupancy chart, transport status
- [ ] Alert rules with threshold-based notifications
- [ ] Real-time data refresh via SSE
- [ ] Fullscreen mode for operations room display
- [ ] Event card shows "Command Center" link in Ops section
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (≥8 new test cases)
