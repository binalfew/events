# Phase 2: Visual Form Designer + UX — Task Index

**Duration:** 8 weeks
**Goal:** Self-service form creation, real-time UX, settings management
**Team:** 2 Senior Frontend Engineers + 1 Backend Developer + 1 UX Designer + 1 QA Engineer

## Prerequisites (from Phase 1)

- Admin can create, edit, reorder, and delete field definitions
- Fields render dynamically on registration forms
- JSONB queries support filtering by field values with expression indexes
- Workflow versioning snapshots active version when participant enters workflow
- SLA overdue detection runs as background job every 5 minutes
- Optimistic locking prevents concurrent approve/reject on same participant
- Rate limiting active on all authenticated API routes
- File uploads scanned for malware before acceptance
- Dynamic Zod schemas validate custom data on every form submission
- Unit test coverage ≥ 85% for new code

## Quality Gate (Phase 2 → Phase 3)

All of the following must be true before Phase 3 begins:

- Admin can build multi-page registration forms via drag-and-drop
- Conditional visibility rules work across pages and sections
- Forms render responsively on mobile and desktop
- SSE delivers real-time updates to validator queues
- Keyboard shortcuts work for approve (A), reject (R), next (→)
- Settings UI shows hierarchy (Global → Tenant → Event) with overrides
- Feature flags toggle module visibility in sidebar
- Notification bell shows unread count with SSE updates
- Form designer has undo/redo (Ctrl+Z / Ctrl+Shift+Z)
- E2E tests pass for form creation → registration → approval flow

## Task List

| Task ID | Title                    | Category      | Depends On | Est. |
| ------- | ------------------------ | ------------- | ---------- | ---- |
| P2-00   | Settings & Feature Flags | Configuration | —          | 5d   |
| P2-01   | FormTemplate Model       | Form Designer | P2-00      | 3d   |
| P2-02   | Three-Panel Designer UI  | Form Designer | P2-01      | 8d   |
| P2-03   | Sections & Pages         | Form Designer | P2-02      | 5d   |
| P2-04   | Drag-and-Drop (DnD Kit)  | Form Designer | P2-02      | 5d   |
| P2-05   | Conditional Visibility   | Form Designer | P2-03      | 6d   |
| P2-06   | Preview Mode             | Form Designer | P2-03      | 4d   |
| P2-07   | Section Templates        | Form Designer | P2-03      | 3d   |
| P2-08   | Skeleton Loading States  | UX            | —          | 2d   |
| P2-09   | SSE Real-Time Updates    | UX            | —          | 5d   |
| P2-10   | Notification System      | Feature       | P2-09      | 5d   |
| P2-11   | Global Search            | UX            | —          | 5d   |
| P2-12   | Keyboard Shortcuts       | UX            | —          | 3d   |

## Dependency Graph

```
P2-00 (Settings) ──► P2-01 (FormTemplate) ──► P2-02 (Designer UI) ──┬──► P2-03 (Sections) ──┬──► P2-05 (Conditions)
                                                                     │                       ├──► P2-06 (Preview)
                                                                     │                       └──► P2-07 (Section Templates)
                                                                     └──► P2-04 (DnD Kit)

P2-08 (Skeletons) ─── independent
P2-09 (SSE) ──► P2-10 (Notifications)
P2-11 (Search) ─── independent
P2-12 (Shortcuts) ─── independent
```

## Suggested Timeline (8 weeks)

**Week 1:** P2-00 (settings foundation), P2-08, P2-09, P2-11, P2-12 (independent UX tasks fan out)
**Week 2:** P2-01 (FormTemplate model), P2-10 (notifications, needs SSE), continue UX tasks
**Week 3–4:** P2-02 (three-panel designer — largest task), P2-04 (DnD kit, can start once canvas exists)
**Week 5:** P2-03 (sections & pages), finalize DnD integration
**Week 6:** P2-05 (conditional visibility), P2-06 (preview mode), P2-07 (section templates)
**Week 7:** Integration testing, cross-feature validation, E2E tests
**Week 8:** Quality gate verification, performance benchmarks, documentation

## Module References

| Module                                                                        | Scope in Phase 2                                        |
| ----------------------------------------------------------------------------- | ------------------------------------------------------- |
| [03 Visual Form Designer](../../modules/03-VISUAL-FORM-DESIGNER.md)           | Full: FormTemplate, designer UI, DnD, sections, preview |
| [07 API & Integration Layer](../../modules/07-API-AND-INTEGRATION-LAYER.md)   | SSE real-time updates                                   |
| [08 UI/UX & Frontend](../../modules/08-UI-UX-AND-FRONTEND.md)                 | Notifications, search, shortcuts, loading states        |
| [17 Settings & Configuration](../../modules/17-SETTINGS-AND-CONFIGURATION.md) | Full: settings hierarchy, feature flags, admin UI       |
