# P4-10: Event Cloning

| Field                  | Value                                                   |
| ---------------------- | ------------------------------------------------------- |
| **Task ID**            | P4-10                                                   |
| **Phase**              | 4 — Ecosystem & Integrations                            |
| **Category**           | Core                                                    |
| **Suggested Assignee** | Backend Developer + Frontend Developer                  |
| **Depends On**         | P4-00 (Foundation Models)                               |
| **Blocks**             | —                                                       |
| **Estimated Effort**   | 3 days                                                  |
| **Module References**  | [Module 16](../../modules/16-PARTICIPANT-EXPERIENCE.md) |

---

## Context

Recurring events (e.g., AU Summit editions 34, 35, 36) share similar configurations — workflows, forms, badge templates, quotas, access restrictions. Manually recreating these for each edition is error-prone and time-consuming. This task builds an event cloning engine that deep-copies selected configuration elements from a source event to a new target event, remapping all foreign keys. It also introduces event series management for grouping editions together. The `EventSeries`, `EventEdition`, and `CloneOperation` models were created in P4-00.

---

## Deliverables

### 1. Event Series Service

Create `app/services/event-series.server.ts`:

```typescript
function createSeries(input: CreateSeriesInput, ctx: TenantContext): Promise<EventSeries>;
function listSeries(tenantId: string): Promise<EventSeries[]>;
function getSeries(id: string, tenantId: string): Promise<EventSeriesWithEditions | null>;
function updateSeries(
  id: string,
  input: UpdateSeriesInput,
  ctx: TenantContext,
): Promise<EventSeries>;
function deleteSeries(id: string, ctx: TenantContext): Promise<void>;

// Link an event to a series as a specific edition
function addEdition(input: AddEditionInput, ctx: TenantContext): Promise<EventEdition>;
function removeEdition(editionId: string, ctx: TenantContext): Promise<void>;
function updateEdition(
  editionId: string,
  input: UpdateEditionInput,
  ctx: TenantContext,
): Promise<EventEdition>;
```

### 2. Clone Engine

Create `app/services/event-clone.server.ts`:

```typescript
interface CloneOptions {
  sourceEventId: string;
  targetEventName: string;
  targetStartDate: string;
  targetEndDate: string;
  elements: {
    workflows: boolean;
    forms: boolean;
    participantTypes: boolean;
    fieldDefinitions: boolean;
    delegations: boolean; // quota allocations (without participants)
    accessRestrictions: boolean;
    checkpoints: boolean;
    badgeTemplates: boolean;
    messageTemplates: boolean;
  };
  seriesId?: string; // optionally link to a series
  editionNumber?: number;
}

// Start a clone operation (async — may take time for large events)
function startCloneOperation(options: CloneOptions, ctx: TenantContext): Promise<CloneOperation>;

// Get clone operation status
function getCloneOperation(id: string, tenantId: string): Promise<CloneOperation | null>;

// List clone operations for tenant
function listCloneOperations(tenantId: string): Promise<CloneOperation[]>;
```

Clone pipeline:

1. Create `CloneOperation` with status `PENDING`
2. Create target `Event` with new name and dates
3. Transition to `IN_PROGRESS`
4. For each enabled element category, deep-copy records:

   **Workflows** (if enabled):
   - Copy `Workflow` → new ID, new `eventId`
   - Copy all `Step` records → new IDs, remap `workflowId`, `nextStepId`, `rejectionTargetId`, etc.
   - Copy `WorkflowVersion` snapshots → remap step references in JSON

   **Forms** (if enabled):
   - Copy `FormTemplate` → new ID, new `eventId`
   - Copy `FormVersion` → remap `formTemplateId`

   **Participant Types** (if enabled):
   - Copy `ParticipantType` → new ID, new `eventId`
   - Remap references in copied workflows and forms

   **Field Definitions** (if enabled):
   - Copy `FieldDefinition` → new ID, new `eventId`
   - Remap `fieldDefinitionId` references in copied forms

   **Delegations** (if enabled):
   - Copy `Delegation` → new ID, new `eventId` (without participants)
   - Copy `DelegationQuota` → new ID, reset `usedQuota` and `pendingQuota` to 0

   **Checkpoints** (if enabled):
   - Copy `Checkpoint` → new ID, new `eventId`

5. Record `elementsCopied` JSON with counts per category
6. Set status to `COMPLETED` with `completedAt`
7. On any error: set status to `FAILED` with `errorLog`

Performance target: clone 1,000 elements in < 60 seconds.

### 3. FK Remapping Engine

Create `app/services/event-clone/fk-remapper.server.ts`:

```typescript
// Maintains a mapping of old IDs → new IDs during cloning
class FKRemapper {
  private idMap: Map<string, string> = new Map();

  // Register a new mapping
  register(oldId: string, newId: string): void;

  // Get the new ID for an old reference
  remap(oldId: string): string | null;

  // Remap all ID references in a JSON object
  remapJson(obj: unknown): unknown;
}
```

- Tracks old ID → new ID for every cloned record
- Used to update foreign key references in steps, forms, and workflow snapshots
- `remapJson()` walks JSON structures replacing known old IDs with new ones

### 4. Clone Wizard UI

Create routes and components:

- `app/routes/events.$eventId.clone.tsx` — clone wizard page
- `app/components/event-clone/clone-wizard.tsx` — multi-step wizard:

  **Step 1 — Source Event:**
  - Shows source event summary (name, dates, element counts)
  - Confirm source selection

  **Step 2 — Target Configuration:**
  - New event name
  - Start date and end date (date pickers)
  - Optional: link to event series (select existing or create new)
  - Optional: edition number and host city/country

  **Step 3 — Element Selection:**
  - Checkboxes for each element category
  - Per-category counts (e.g., "3 workflows, 12 forms, 5 participant types")
  - "Select All" toggle
  - Dependencies noted (e.g., "Forms require Field Definitions")

  **Step 4 — Confirmation:**
  - Summary of what will be cloned
  - "Start Clone" button

  **Step 5 — Progress:**
  - Progress indicator per element category
  - Overall progress bar
  - Status: pending → in progress → completed/failed
  - On completion: "View New Event" link

### 5. Event Series Management UI

Create routes and components:

- `app/routes/settings.event-series.tsx` — series list page
- `app/components/event-series/series-list.tsx` — table with name, edition count, latest edition
- `app/components/event-series/series-detail.tsx`:
  - Series info (name, description)
  - Edition timeline: chronological list of editions with year, host city, event link
  - "Add Edition" button (link existing event or create via clone)
- `app/components/event-series/create-series-dialog.tsx` — name and description form

### 6. Feature Flag Gate

All event cloning features gated behind `FF_EVENT_CLONE`:

- Clone wizard returns 404 when disabled
- "Clone Event" button hidden in event actions
- Event series management hidden in settings
- Requires `event-clone:execute` permission

---

## Acceptance Criteria

- [ ] Clone operation deep-copies selected element categories to a new event
- [ ] FK remapping ensures all references point to new IDs (no dangling references)
- [ ] Workflows cloned with all steps, transitions, conditions, and SLA rules
- [ ] Forms cloned with all fields, sections, and validation rules
- [ ] Delegation quotas cloned with counters reset to zero
- [ ] Clone of 1,000 elements completes in < 60 seconds
- [ ] Clone wizard shows element counts and dependency warnings
- [ ] Progress tracking shows per-category and overall status
- [ ] Failed clone records error details; partial results preserved
- [ ] Event series groups editions chronologically
- [ ] Edition management: add, remove, update host city/country
- [ ] Feature flag `FF_EVENT_CLONE` gates all functionality
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] Unit tests for FK remapping, clone pipeline, series management (≥8 test cases)
