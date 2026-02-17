# P4-03: Check-in & QR Code System

| Field                  | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| **Task ID**            | P4-03                                                    |
| **Phase**              | 4 — Ecosystem & Integrations                             |
| **Category**           | Feature                                                  |
| **Suggested Assignee** | Senior Backend Developer + Frontend Developer            |
| **Depends On**         | P4-00 (Foundation Models)                                |
| **Blocks**             | P4-05 (Kiosk Mode)                                       |
| **Estimated Effort**   | 5 days                                                   |
| **Module References**  | [Module 10](../../modules/10-EVENT-OPERATIONS-CENTER.md) |

---

## Context

On-site event operations require fast badge scanning at checkpoints (gates, meeting rooms, VIP areas). This task builds the QR code generation pipeline, badge scanning engine, checkpoint management, real-time venue occupancy tracking, and the access log. The `Checkpoint`, `AccessLog`, and `VenueOccupancy` models were created in P4-00.

---

## Deliverables

### 1. QR Code Generation Service

Create `app/services/qr-code.server.ts`:

```typescript
// Generate encrypted QR payload for a participant badge
function generateQRPayload(participantId: string, tenantId: string, eventId: string): string;

// Decode and validate QR payload
function decodeQRPayload(payload: string): QRPayloadData | null;
```

QR payload structure:

- Encrypt with AES-256-GCM using a per-tenant encryption key
- Payload contents: `{ participantId, tenantId, eventId, issuedAt, version }`
- Base64-encode the encrypted buffer for QR encoding
- Include a 4-byte checksum for quick invalid-scan detection

### 2. Badge Scanning Engine

Create `app/services/check-in.server.ts`:

```typescript
interface ScanRequest {
  qrPayload: string;
  checkpointId: string;
  scanType: ScanType;
  scannedBy: string;
  deviceId?: string;
}

interface ScanResponse {
  result: ScanResult;
  participant?: {
    id: string;
    name: string;
    photoUrl?: string;
    status: string;
    participantType: string;
  };
  message: string;
  accessLog: AccessLog;
}

// Process a badge scan — must complete in < 500ms
function processScan(input: ScanRequest): Promise<ScanResponse>;
```

Scan validation pipeline:

1. Decode QR payload → `INVALID` if decryption fails
2. Look up participant → `INVALID` if not found
3. Check participant status → `REVOKED` if archived/returned, `EXPIRED` if event ended
4. Check checkpoint access restrictions (zone access level vs. participant type)
5. Check venue capacity → `ALREADY_SCANNED` for duplicate entry (configurable: allow re-entry or not)
6. Log scan in `AccessLog`
7. Update `VenueOccupancy` (increment for entry, decrement for exit based on checkpoint direction)
8. Return result with participant summary for display

### 3. Checkpoint Management Service

Create `app/services/checkpoints.server.ts`:

```typescript
function createCheckpoint(input: CreateCheckpointInput, ctx: TenantContext): Promise<Checkpoint>;
function listCheckpoints(eventId: string, tenantId: string): Promise<Checkpoint[]>;
function updateCheckpoint(
  id: string,
  input: UpdateCheckpointInput,
  ctx: TenantContext,
): Promise<Checkpoint>;
function deleteCheckpoint(id: string, ctx: TenantContext): Promise<void>;
function toggleCheckpoint(id: string, isActive: boolean, ctx: TenantContext): Promise<Checkpoint>;
```

Checkpoint configuration:

- `type`: "gate", "meeting-room", "vip-area", "registration-desk"
- `direction`: "entry", "exit", "bidirectional"
- `capacity`: optional max capacity for zone

### 4. Venue Occupancy Service

Create `app/services/venue-occupancy.server.ts`:

```typescript
// Get real-time occupancy for event (all zones)
function getEventOccupancy(eventId: string): Promise<VenueOccupancy[]>;

// Get occupancy for specific zone
function getZoneOccupancy(eventId: string, zoneId: string): Promise<VenueOccupancy | null>;

// Update occupancy after scan (called by check-in service)
function updateOccupancy(
  eventId: string,
  zoneId: string | null,
  delta: number,
): Promise<VenueOccupancy>;

// Initialize occupancy records for event zones
function initializeOccupancy(
  eventId: string,
  zones: { zoneId: string; maxCapacity: number }[],
): Promise<void>;
```

- Atomic increment/decrement using Prisma `update` with `increment`
- Emit SSE event on occupancy change for real-time dashboard updates

### 5. Scanner UI

Create routes and components:

- `app/routes/events.$eventId.check-in.tsx` — scanner page (mobile-optimized)
- `app/components/check-in/qr-scanner.tsx` — camera-based QR reader using `html5-qrcode` library
- `app/components/check-in/scan-result-display.tsx` — large visual feedback:
  - Green screen + participant photo/name for VALID
  - Red screen + reason for INVALID/EXPIRED/REVOKED
  - Yellow screen for ALREADY_SCANNED with override option
- `app/components/check-in/manual-entry.tsx` — fallback text input for manual badge ID entry
- `app/components/check-in/checkpoint-selector.tsx` — dropdown to select active checkpoint

Scanner UX:

- Auto-focus camera on mount
- Audio feedback: success beep for VALID, error tone for denied
- Scan history: last 20 scans visible in a sidebar list
- Works offline with cached participant data (sync when reconnected)

### 6. Checkpoint Management UI

- `app/routes/events.$eventId.settings.checkpoints.tsx` — checkpoint CRUD page
- `app/components/checkpoints/checkpoint-list.tsx` — table with name, type, direction, active status
- `app/components/checkpoints/checkpoint-form.tsx` — create/edit form

### 7. Occupancy Dashboard Widget

Create `app/components/occupancy/occupancy-panel.tsx`:

- Real-time occupancy bars per zone (current / max capacity)
- Color coding: green (<75%), yellow (75-90%), red (>90%)
- Total event occupancy summary
- Auto-refresh via SSE subscription

### 8. Access Log Viewer

- `app/routes/events.$eventId.access-logs.tsx` — paginated access log list
- `app/components/check-in/access-log-table.tsx` — filterable table: participant, checkpoint, scan type, result, timestamp
- Export to CSV

### 9. Feature Flag Gate

All check-in features gated behind existing feature flags:

- Scanner UI requires `check-in:scan` permission
- Checkpoint management requires `check-in:scan` or admin role

---

## Acceptance Criteria

- [ ] QR payload encrypted with AES-256-GCM, decryptable for validation
- [ ] Badge scan completes in < 500ms (decode + validate + log + respond)
- [ ] Scan results visually distinct: green (valid), red (denied), yellow (warning)
- [ ] Camera-based QR scanner works on mobile browsers
- [ ] Manual entry fallback for damaged/unreadable badges
- [ ] Venue occupancy updates atomically on each scan
- [ ] Occupancy dashboard shows real-time zone-level counts with color coding
- [ ] Checkpoint CRUD with type, direction, and capacity configuration
- [ ] Access log viewable with filtering by checkpoint, result, and date range
- [ ] Override option for ALREADY_SCANNED with reason capture
- [ ] Audio feedback on scan (success/failure tones)
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] Unit tests for QR generation/decoding, scan validation pipeline (≥8 test cases)
