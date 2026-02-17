# P3-11: Integration Testing & Quality Gate

| Field                  | Value                                                      |
| ---------------------- | ---------------------------------------------------------- |
| **Task ID**            | P3-11                                                      |
| **Phase**              | 3 — Advanced Features                                      |
| **Category**           | Quality                                                    |
| **Suggested Assignee** | QA Engineer + Full-Stack Engineer                          |
| **Depends On**         | P3-01 through P3-10 (all previous tasks)                   |
| **Blocks**             | Phase 4                                                    |
| **Estimated Effort**   | 5 days                                                     |
| **Module References**  | [Module 06](../../modules/06-INFRASTRUCTURE-AND-DEVOPS.md) |

---

## Context

Phase 3 introduces 10 major features. Before advancing to Phase 4, each feature must be verified through integration tests, E2E flows, and quality audits. This task ensures all Phase 3 features meet the quality gate.

---

## Deliverables

### 1. Integration Tests

Create `tests/integration/phase-3/`:

**i18n tests (`i18n.test.ts`):**

- Language cookie sets correct locale
- RTL direction applied for Arabic
- Translation keys resolve for all 4 locales
- Language switcher persists choice

**Conditional routing tests (`conditional-routing.test.ts`):**

- Condition evaluation routes to correct step
- Default route used when no condition matches
- Multiple conditions evaluated by priority
- Compound AND/OR conditions work

**Step assignment tests (`step-assignment.test.ts`):**

- Manual assignment creates correct record
- Round-robin cycles through assignees
- Least-loaded picks user with fewest active items
- Reassignment deactivates old, creates new

**Auto-action tests (`auto-action.test.ts`):**

- Matching rule triggers auto-action
- Priority ordering: first match wins
- Chained auto-actions work (step A → step B)
- Max depth prevents infinite loops
- No match: falls through to manual

**Delegation tests (`delegation.test.ts`):**

- Quota enforcement: cannot exceed max
- Invite token validation
- Accept increments used count
- Expired invite rejection
- Cancel invite flow

**Saved views tests (`saved-views.test.ts`):**

- CRUD for views
- Personal vs shared visibility
- Default view selection
- Filter/sort application

**Custom objects tests (`custom-objects.test.ts`):**

- Definition CRUD
- Record CRUD with validation
- Slug generation and uniqueness
- Deactivation preserves records

**Analytics tests (`analytics.test.ts`):**

- Summary counts match database
- Funnel data accuracy
- SLA compliance calculation
- Empty data handling

**Offline tests (`offline.test.ts`):**

- Mutation enqueue and dequeue
- Sync replay order
- Conflict resolution
- Failed mutation retry limit

### 2. E2E Tests

Create `tests/e2e/phase-3/`:

**Critical flows:**

- **`delegation-flow.spec.ts`**: Admin creates quota → focal point sends invite → delegate accepts → participant registered
- **`conditional-workflow.spec.ts`**: Participant with VIP flag auto-routed to fast-track step
- **`saved-views.spec.ts`**: User creates view → switches between views → shared view visible to other user
- **`analytics.spec.ts`**: Dashboard loads with charts → filter by event → CSV export downloads

### 3. Performance Benchmarks

- Analytics queries: < 500ms for 10k participants
- Condition evaluation: < 10ms per participant
- Saved view loading: < 300ms
- Offline queue operations: < 50ms

### 4. Accessibility Audit

- Keyboard navigation through all new UI components
- Screen reader testing with NVDA/VoiceOver
- RTL layout verification for Arabic locale
- Color contrast: WCAG 2.1 AA for all new components
- Focus management in modals and dropdowns

### 5. Phase Completion Document

Create `docs/PHASE-3-COMPLETION.md`:

For each task (P3-00 through P3-10):

- Task ID and title
- Summary of what was implemented (files created/modified)
- Verification results (typecheck, tests, seed, migration)
- Any notable decisions or deviations from the plan

---

## Acceptance Criteria

- [ ] Integration tests written for all 10 features
- [ ] E2E tests for 4 critical flows
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Performance benchmarks met
- [ ] Accessibility audit passes (keyboard, screen reader, RTL, contrast)
- [ ] `docs/PHASE-3-COMPLETION.md` complete with all task entries
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] `npm run test:e2e` passes
