# P4-09: Duplicate Detection & Merge

| Field                  | Value                                                           |
| ---------------------- | --------------------------------------------------------------- |
| **Task ID**            | P4-09                                                           |
| **Phase**              | 4 — Ecosystem & Integrations                                    |
| **Category**           | Security                                                        |
| **Suggested Assignee** | Backend Developer + Frontend Developer                          |
| **Depends On**         | P4-00 (Foundation Models)                                       |
| **Blocks**             | —                                                               |
| **Estimated Effort**   | 4 days                                                          |
| **Module References**  | [Module 09](../../modules/09-REGISTRATION-AND-ACCREDITATION.md) |

---

## Context

Accreditation events must prevent the same person from registering multiple times — whether within the same event or across concurrent events in the same tenant. This task builds a multi-layered duplicate detection engine that runs on registration, a blacklist screening system, a merge tool for confirmed duplicates, and an admin review queue. The `DuplicateCandidate`, `MergeHistory`, and `Blacklist` models were created in P4-00.

---

## Deliverables

### 1. Duplicate Detection Engine

Create `app/services/duplicate-detection.server.ts`:

```typescript
interface DuplicateCheckResult {
  hasDuplicates: boolean;
  candidates: DuplicateMatch[];
  highestScore: number;
  recommendation: "pass" | "warning" | "auto-flag";
}

interface DuplicateMatch {
  participantId: string;
  participantName: string;
  eventId: string;
  eventName: string;
  confidenceScore: number;
  matchFields: MatchField[];
}

interface MatchField {
  field: string;
  sourceValue: string;
  matchValue: string;
  score: number;
  matchType: "exact" | "fuzzy" | "soundex" | "cross-field";
}

// Run duplicate detection against a new registration
function detectDuplicates(
  input: ParticipantRegistrationData,
  tenantId: string,
  eventId: string,
): Promise<DuplicateCheckResult>;
```

Multi-layered detection algorithm:

**Layer 1 — Exact Match:**

- Passport number exact match → confidence 1.0
- Email exact match → confidence 0.95
- Phone number exact match (normalized) → confidence 0.90

**Layer 2 — Fuzzy Match:**

- Name Levenshtein distance ≤ 2 characters → confidence 0.85
- Name Soundex match → confidence 0.80
- Name + date of birth match → confidence 0.90

**Layer 3 — Cross-Field Scoring:**

- Start with highest single-field score
- Add 0.05 for each additional matching field (capped at +0.15)

**Layer 4 — Threshold Decision:**

- Score ≥ 0.90 → `auto-flag` (create DuplicateCandidate, block registration)
- Score 0.70–0.89 → `warning` (create DuplicateCandidate, allow with warning)
- Score < 0.70 → `pass` (no duplicate concern)

Search scope:

- Same event participants
- All concurrent events in the same tenant (cross-event detection)

### 2. Blacklist Screening Service

Create `app/services/blacklist.server.ts`:

```typescript
interface BlacklistCheckResult {
  isBlacklisted: boolean;
  matches: BlacklistMatch[];
}

interface BlacklistMatch {
  blacklistId: string;
  matchType: "exact-passport" | "exact-email" | "fuzzy-name";
  confidence: number;
  reason: string;
  source: string;
}

// Screen a registration against the blacklist
function screenAgainstBlacklist(
  input: ParticipantRegistrationData,
  tenantId: string,
): Promise<BlacklistCheckResult>;

// CRUD for blacklist entries
function addToBlacklist(input: AddBlacklistInput, ctx: TenantContext): Promise<Blacklist>;
function listBlacklist(
  tenantId: string,
  filters?: BlacklistFilters,
): Promise<PaginatedResult<Blacklist>>;
function updateBlacklistEntry(
  id: string,
  input: UpdateBlacklistInput,
  ctx: TenantContext,
): Promise<Blacklist>;
function removeFromBlacklist(id: string, ctx: TenantContext): Promise<void>;
```

Screening checks:

- Exact passport number match
- Exact email match
- Fuzzy name match using `nameVariations` array (Levenshtein ≤ 2)
- Check `isActive` and `expiresAt` to skip expired entries
- Tenant-level entries (`tenantId` set) and global entries (`tenantId` null)

### 3. Registration Pipeline Integration

Integrate into the registration flow:

```typescript
// In the registration service, before creating participant:
async function preRegistrationChecks(input, tenantId, eventId) {
  // 1. Blacklist screening
  const blacklistResult = await screenAgainstBlacklist(input, tenantId);
  if (blacklistResult.isBlacklisted) {
    throw new RegistrationBlockedError("Blacklisted", blacklistResult.matches);
  }

  // 2. Duplicate detection
  const dupeResult = await detectDuplicates(input, tenantId, eventId);
  if (dupeResult.recommendation === "auto-flag") {
    // Create DuplicateCandidate records, block registration
    await createDuplicateCandidates(input, dupeResult.candidates, tenantId, eventId);
    throw new DuplicateDetectedError(dupeResult);
  }
  if (dupeResult.recommendation === "warning") {
    // Create DuplicateCandidate records, allow registration with warning flag
    await createDuplicateCandidates(input, dupeResult.candidates, tenantId, eventId);
    // Proceed but flag for review
  }
}
```

### 4. Merge Service

Create `app/services/participant-merge.server.ts`:

```typescript
interface MergeInput {
  survivingId: string; // the record that will be kept
  mergedId: string; // the record that will be absorbed
  fieldResolution: Record<string, "surviving" | "merged">; // per-field choice
}

// Merge two participant records
function mergeParticipants(input: MergeInput, ctx: TenantContext): Promise<MergeHistory>;
```

Merge process:

1. Validate both participants exist in same tenant
2. For each field, use the value from the chosen record (`surviving` or `merged`)
3. Migrate all approvals/workflow history from merged → surviving
4. Migrate all access logs, queue tickets, message deliveries
5. Update `DuplicateCandidate` status to `MERGED`
6. Soft-delete the merged participant record
7. Create `MergeHistory` audit record with full field resolution details
8. Count migrated approvals in `approvalsMigrated`

### 5. Duplicate Review Queue UI

Create routes and components:

- `app/routes/events.$eventId.duplicates.tsx` — duplicate review queue
- `app/components/duplicates/duplicate-queue.tsx`:
  - Table: candidate pair, confidence score, match fields, status, date detected
  - Filters: status (PENDING_REVIEW, CONFIRMED_DUPLICATE, NOT_DUPLICATE, MERGED), score range
  - Sort by confidence score (highest first)

- `app/components/duplicates/duplicate-review.tsx`:
  - Side-by-side comparison of two participant records
  - Matching fields highlighted with confidence scores
  - For each field: radio buttons to choose which value to keep (for merge)
  - Action buttons:
    - "Confirm Duplicate & Merge" → opens merge resolution
    - "Not a Duplicate" → marks as NOT_DUPLICATE
    - "Skip" → keeps in queue for later review
  - Notes field for reviewer comments

### 6. Blacklist Management UI

Create routes and components:

- `app/routes/events.$eventId.settings.blacklist.tsx` — blacklist management page
- `app/components/blacklist/blacklist-table.tsx`:
  - Table: name, passport, email, reason, source, active status, expiry
  - Add/edit/remove actions
  - Search and filter

- `app/components/blacklist/blacklist-form.tsx`:
  - Fields: type (individual/organization), name, name variations, passport, email, DOB, nationality, organization, reason, source, expiry date
  - Name variations: add multiple alternate spellings/transliterations

### 7. Merge History Viewer

- `app/routes/events.$eventId.merge-history.tsx` — merge audit trail
- `app/components/duplicates/merge-history-table.tsx`:
  - Table: surviving participant, merged participant, fields resolved, approvals migrated, merged by, date
  - Expandable detail showing full field resolution

### 8. Feature Flag Gate

Duplicate detection runs automatically when enabled (no separate feature flag — part of registration pipeline). Blacklist management gated behind `blacklist:manage` permission. Duplicate review requires `duplicates:review` permission.

---

## Acceptance Criteria

- [ ] Exact match detection: passport (1.0), email (0.95), phone (0.90) confidence
- [ ] Fuzzy match detection: name Levenshtein ≤2 (0.85), Soundex (0.80), name+DOB (0.90)
- [ ] Cross-field scoring adds 0.05 per additional match (capped at +0.15)
- [ ] Score ≥ 0.90 blocks registration and flags for review
- [ ] Score 0.70–0.89 allows registration with warning flag
- [ ] Cross-event duplicate detection within same tenant
- [ ] Blacklist screening blocks registration on exact passport/email match
- [ ] Fuzzy name matching against blacklist name variations
- [ ] Merge combines two records: field-by-field resolution, approval migration
- [ ] Merge creates audit trail with full field resolution details
- [ ] Review queue shows candidates sorted by confidence score
- [ ] Side-by-side comparison with highlighted matching fields
- [ ] Blacklist CRUD with name variations and expiry
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] Unit tests for each detection layer, merge logic, blacklist screening (≥12 test cases)
