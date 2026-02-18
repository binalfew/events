# P5-13: Document Expiry & Compliance

| Field                  | Value                                                      |
| ---------------------- | ---------------------------------------------------------- |
| **Task ID**            | P5-13                                                      |
| **Phase**              | 5 — Event Operations & Logistics                           |
| **Category**           | Compliance                                                 |
| **Suggested Assignee** | Backend Developer                                          |
| **Depends On**         | P5-00 (Foundation Models)                                  |
| **Blocks**             | —                                                          |
| **Estimated Effort**   | 4 days                                                     |
| **Module References**  | [Module 15](../../modules/15-COMPLIANCE-AND-GOVERNANCE.md) |

---

## Context

Compliance management tracks document requirements (passports, visas, medical certificates), alerts on upcoming expiry dates, enforces data retention policies for GDPR compliance, and provides an audit-ready dashboard. The `DocumentRequirement`, `ParticipantDocument`, and `DataRetentionPolicy` models were created in P5-00.

---

## Deliverables

### 1. Compliance Service

Create `app/services/compliance.server.ts`:

- `createDocumentRequirement(input, ctx)` — Define required document (type, name, required for participant types, expiry tracking)
- `listDocumentRequirements(eventId, tenantId)` — Requirements with compliance rates
- `submitDocument(participantId, requirementId, input, ctx)` — Upload/record document (number, expiry date, file reference)
- `verifyDocument(documentId, input, ctx)` — Admin verification (approve/reject with notes)
- `getParticipantCompliance(participantId, tenantId)` — All required documents with status for a participant
- `getComplianceDashboard(eventId, tenantId)` — Overall compliance rates, expiring documents, missing documents
- `getExpiringDocuments(eventId, tenantId, daysAhead?)` — Documents expiring within N days (default 30)
- `createRetentionPolicy(input, ctx)` — Define data retention rule (entity type, retention period, action)
- `listRetentionPolicies(tenantId)` — Active retention policies
- `executeRetentionPolicy(policyId, ctx)` — Run retention (anonymize or delete expired data)
- `getRetentionReport(tenantId)` — Data subject counts, upcoming retention actions

### 2. Expiry Check Background Job

Create `server/document-expiry-job.js`:

- Runs daily
- Checks for documents expiring within 30/14/7 days
- Sends notifications to admin and optionally to participant delegations

### 3. Zod Schemas

Create `app/lib/schemas/compliance.ts`

### 4. Admin UI Route

Create `app/routes/admin/events/$eventId/compliance.tsx`:

- Document requirements configuration, compliance dashboard with rates
- Expiring/missing document alerts, retention policy management
- Feature flag: `FF_COMPLIANCE_DASHBOARD`

### 5. Tests

Create `app/services/__tests__/compliance.server.test.ts` — ≥10 test cases

---

## Acceptance Criteria

- [ ] Document requirements configurable per participant type
- [ ] Document submission with expiry date tracking
- [ ] Admin verification workflow (approve/reject)
- [ ] Compliance dashboard shows rates and alerts
- [ ] Expiring document notifications (30/14/7 day warnings)
- [ ] Data retention policies with anonymize/delete actions
- [ ] Background job for daily expiry checks
- [ ] Feature flag `FF_COMPLIANCE_DASHBOARD` gates all functionality
- [ ] Event card shows "Compliance" link in Settings section
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (≥10 new test cases)
