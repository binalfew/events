# P4-06: Bulk Operations Framework

| Field                  | Value                                                           |
| ---------------------- | --------------------------------------------------------------- |
| **Task ID**            | P4-06                                                           |
| **Phase**              | 4 — Ecosystem & Integrations                                    |
| **Category**           | Feature                                                         |
| **Suggested Assignee** | Backend Developer + Frontend Developer                          |
| **Depends On**         | P4-00 (Foundation Models)                                       |
| **Blocks**             | P4-07 (Batch Workflow Actions)                                  |
| **Estimated Effort**   | 5 days                                                          |
| **Module References**  | [Module 09](../../modules/09-REGISTRATION-AND-ACCREDITATION.md) |

---

## Context

Event organizers need to import thousands of participants from CSV/Excel files and perform bulk status changes, field updates, and exports. This task builds the bulk operations framework: file upload and parsing, column mapping, row-level validation with preview, batch processing with progress reporting, error logging, and undo capability. The `BulkOperation` and `BulkOperationItem` models were created in P4-00.

---

## Deliverables

### 1. CSV/Excel Parser

Create `app/services/bulk-import/parser.server.ts`:

```typescript
interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  encoding: string;
  delimiter: string;
}

// Parse uploaded file (CSV or XLSX)
function parseImportFile(buffer: Buffer, mimeType: string): Promise<ParseResult>;
```

- Support CSV (comma, semicolon, tab delimited) with auto-detection
- Support XLSX via `xlsx` library (first sheet only)
- UTF-8 encoding with BOM handling
- Max file size: 10MB
- Max rows: 10,000

### 2. Column Mapping Service

Create `app/services/bulk-import/column-mapper.server.ts`:

```typescript
interface ColumnMapping {
  sourceColumn: string;
  targetField: string; // Prisma field name or FieldDefinition key
  transform?: "uppercase" | "lowercase" | "trim" | "date-parse";
}

// Auto-suggest column mappings based on header similarity
function suggestColumnMappings(headers: string[], targetFields: FieldDefinition[]): ColumnMapping[];

// Apply column mappings to parsed rows
function applyMappings(
  rows: Record<string, string>[],
  mappings: ColumnMapping[],
): Record<string, unknown>[];
```

Auto-suggestion uses normalized string matching:

- Exact match (case-insensitive)
- Common aliases: "first name" → `firstName`, "email address" → `email`, "passport no" → `passportNumber`
- Fuzzy match using Levenshtein distance (threshold ≤ 2)

### 3. Row Validation Service

Create `app/services/bulk-import/validator.server.ts`:

```typescript
interface ValidationResult {
  rowNumber: number;
  status: "valid" | "warning" | "error";
  errors: { field: string; message: string }[];
  warnings: { field: string; message: string }[];
}

// Validate all rows against field definitions and schema
function validateImportRows(
  rows: Record<string, unknown>[],
  eventId: string,
  tenantId: string,
): Promise<ValidationResult[]>;
```

Validation checks per row:

- Required fields present and non-empty
- Type validation (email format, date format, phone format)
- Enum values match allowed options (participant type, nationality)
- Duplicate detection within file (email, passport)
- Duplicate detection against existing participants in DB

### 4. Bulk Operation Service

Create `app/services/bulk-operations.server.ts`:

```typescript
// Create a bulk operation (starts in VALIDATING status)
function createBulkOperation(input: CreateBulkOpInput, ctx: TenantContext): Promise<BulkOperation>;

// Run validation and transition to PREVIEW
function validateOperation(operationId: string): Promise<BulkOperation>;

// Confirm operation (after user reviews preview) — transitions to PROCESSING
function confirmOperation(operationId: string, ctx: TenantContext): Promise<BulkOperation>;

// Execute the operation in batches
function executeOperation(operationId: string): Promise<BulkOperation>;

// Undo a completed operation (within 24-hour window)
function undoOperation(operationId: string, ctx: TenantContext): Promise<BulkOperation>;

// Get operation with items and progress
function getOperation(
  operationId: string,
  tenantId: string,
): Promise<BulkOperationWithItems | null>;

// List operations for event
function listOperations(
  eventId: string,
  tenantId: string,
  filters?: BulkOpFilters,
): Promise<PaginatedResult<BulkOperation>>;
```

Execution flow:

1. **VALIDATING**: Parse file, validate rows, create `BulkOperationItem` per row
2. **PREVIEW**: Show validation results to user (valid/warning/error counts)
3. **CONFIRMED**: User approves after reviewing preview
4. **PROCESSING**: Process in batches of 50, update progress counters
5. **COMPLETED**: All items processed, snapshot stored for undo
6. **FAILED**: Critical error during processing (partial results preserved)
7. **ROLLED_BACK**: Undo executed within deadline

### 5. Snapshot & Undo Service

Create `app/services/bulk-import/undo.server.ts`:

```typescript
// Capture pre-operation state for rollback
function captureSnapshot(operationId: string, participantIds: string[]): Promise<void>;

// Restore from snapshot
function restoreFromSnapshot(operationId: string): Promise<void>;
```

- Before processing, snapshot affected participants' current state in `snapshotData` (JSON)
- Undo restores each participant to their pre-operation state
- Undo deadline: 24 hours after completion (configurable)
- After deadline, undo button disabled with explanation

### 6. Export Service

Create `app/services/bulk-export.server.ts`:

```typescript
// Generate CSV export for participants matching filters
function exportParticipants(
  eventId: string,
  tenantId: string,
  filters: ParticipantFilters,
  fields: string[],
): Promise<{ url: string; filename: string }>;
```

- Stream rows to avoid memory issues for large datasets
- Support field selection (which columns to include)
- Include both fixed fields and custom `extras` fields
- Generate downloadable CSV with UTF-8 BOM for Excel compatibility

### 7. Bulk Import Wizard UI

Create routes and components:

- `app/routes/events.$eventId.bulk-operations.tsx` — operations list page
- `app/routes/events.$eventId.bulk-operations.import.tsx` — import wizard
- `app/components/bulk-operations/operation-list.tsx` — table with type, status, progress, counts, created date
- `app/components/bulk-operations/import-wizard.tsx` — multi-step wizard:

  **Step 1 — Upload:**
  - File dropzone (CSV/XLSX)
  - File info display (size, rows detected, encoding)

  **Step 2 — Column Mapping:**
  - Side-by-side: source columns → target fields
  - Auto-suggested mappings (editable)
  - Unmapped columns highlighted in yellow
  - Required fields marked with asterisk

  **Step 3 — Validation Preview:**
  - Summary: X valid, Y warnings, Z errors
  - Table showing first 20 rows with color-coded status
  - Expandable error/warning details per row
  - "Proceed with valid rows only" option if errors exist

  **Step 4 — Processing:**
  - Progress bar with percentage and counts
  - Real-time updates via polling (2-second interval)
  - Cancel button (stops processing remaining items)

  **Step 5 — Results:**
  - Final summary: imported, skipped, failed
  - Download error report (CSV of failed rows with reasons)
  - "Undo" button (available for 24 hours)

### 8. Bulk Export UI

- `app/routes/events.$eventId.bulk-operations.export.tsx` — export page
- `app/components/bulk-operations/export-form.tsx`:
  - Field selector (checkboxes for columns to include)
  - Filter options (same as participant list filters)
  - Format selector (CSV only for now)
  - "Export" button with download on completion

### 9. Feature Flag Gate

All bulk operations features gated behind `FF_BULK_OPERATIONS`:

- Import/export routes return 404 when disabled
- Bulk operations navigation hidden
- Requires `bulk-operations:execute` permission

---

## Acceptance Criteria

- [ ] CSV import handles 10,000 records with progress feedback
- [ ] XLSX (first sheet) imported with auto-delimiter detection for CSV
- [ ] Column mapping auto-suggests based on header similarity
- [ ] Row-level validation catches type errors, missing required fields, duplicates
- [ ] Preview shows first 20 rows with color-coded validation status
- [ ] Batch processing in groups of 50 with real-time progress updates
- [ ] Error report downloadable as CSV with row numbers and error messages
- [ ] Undo restores pre-operation state within 24-hour window
- [ ] Export generates UTF-8 CSV with BOM for Excel compatibility
- [ ] Export supports field selection and participant filters
- [ ] Feature flag `FF_BULK_OPERATIONS` gates all functionality
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] Unit tests for parser, column mapper, validator, undo (≥12 test cases)
