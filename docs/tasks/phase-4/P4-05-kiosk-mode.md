# P4-05: Kiosk Mode

| Field                  | Value                                                    |
| ---------------------- | -------------------------------------------------------- |
| **Task ID**            | P4-05                                                    |
| **Phase**              | 4 — Ecosystem & Integrations                             |
| **Category**           | Feature                                                  |
| **Suggested Assignee** | Frontend Developer                                       |
| **Depends On**         | P4-03 (Check-in & QR Code System)                        |
| **Blocks**             | —                                                        |
| **Estimated Effort**   | 4 days                                                   |
| **Module References**  | [Module 10](../../modules/10-EVENT-OPERATIONS-CENTER.md) |

---

## Context

Self-service kiosks at event venues allow participants to look up their accreditation status, join queues, and check in without staff assistance. This task builds the kiosk mode: a fullscreen, touch-optimized interface with auto-reset, device registration, queue management, and admin monitoring. The `KioskDevice`, `KioskSession`, and `QueueTicket` models were created in P4-00.

---

## Deliverables

### 1. Kiosk Device Service

Create `app/services/kiosk-devices.server.ts`:

```typescript
function registerDevice(input: RegisterDeviceInput, ctx: TenantContext): Promise<KioskDevice>;
function listDevices(eventId: string, tenantId: string): Promise<KioskDevice[]>;
function getDevice(id: string): Promise<KioskDevice | null>;
function updateDevice(
  id: string,
  input: UpdateDeviceInput,
  ctx: TenantContext,
): Promise<KioskDevice>;
function decommissionDevice(id: string, ctx: TenantContext): Promise<void>;

// Heartbeat — called every 30s from kiosk client
function recordHeartbeat(deviceId: string): Promise<void>;

// Mark devices offline if no heartbeat for 3+ minutes
function markStaleDevicesOffline(): Promise<number>;
```

Device modes:

- `self-service` — status lookup + queue join
- `check-in` — badge scanning at entry points
- `info` — wayfinding and schedule display only

### 2. Kiosk Session Service

Create `app/services/kiosk-sessions.server.ts`:

```typescript
function startSession(
  deviceId: string,
  sessionType: string,
  language: string,
): Promise<KioskSession>;
function endSession(sessionId: string, timedOut: boolean): Promise<KioskSession>;
function getActiveSession(deviceId: string): Promise<KioskSession | null>;

// Stats for admin dashboard
function getDeviceStats(deviceId: string, dateRange: DateRange): Promise<KioskDeviceStats>;
```

Session types: `status-lookup`, `queue-join`, `check-in`, `info-browse`

### 3. Queue Management Service

Create `app/services/queue-tickets.server.ts`:

```typescript
// Join queue — assigns next ticket number
function joinQueue(input: JoinQueueInput, ctx: TenantContext): Promise<QueueTicket>;

// Call next ticket from queue
function callNextTicket(
  eventId: string,
  counterNumber: number,
  ctx: TenantContext,
): Promise<QueueTicket | null>;

// Mark ticket as being served
function startServing(ticketId: string, ctx: TenantContext): Promise<QueueTicket>;

// Complete service
function completeService(ticketId: string, ctx: TenantContext): Promise<QueueTicket>;

// Cancel ticket (participant left)
function cancelTicket(ticketId: string, ctx: TenantContext): Promise<QueueTicket>;

// Get queue status for display board
function getQueueStatus(eventId: string): Promise<QueueDisplayData>;

// Get estimated wait time
function estimateWaitTime(eventId: string, priority: number): Promise<number>; // minutes
```

Queue behavior:

- Ticket numbers: sequential per event per day (e.g., `A001`, `A002`)
- Priority ordering: higher priority served first within FIFO
- Estimated wait calculated from average service time × position in queue

### 4. Kiosk Fullscreen Shell

Create `app/routes/kiosk.$deviceId.tsx` — kiosk layout route:

- Fullscreen mode (Fullscreen API) with hidden browser chrome
- Touch-optimized: large buttons (min 48px tap targets), high contrast
- Auto-reset after 120 seconds of inactivity (configurable)
- Language selector (en/fr/am/ar) with RTL support
- No navigation to external URLs
- Heartbeat ping every 30 seconds

### 5. Kiosk Self-Service Module

Create `app/routes/kiosk.$deviceId.self-service.tsx` and components:

- `app/components/kiosk/status-lookup.tsx`:
  - Input: badge QR scan or email address
  - Display: participant name, photo, accreditation status, participant type
  - Action buttons: "Join Queue" (if applicable), "Done"
  - Large, clear status indicator (approved = green badge, pending = yellow, rejected = red)

- `app/components/kiosk/queue-join.tsx`:
  - Participant selects service type
  - System assigns ticket number
  - Displays: ticket number, estimated wait time, queue position
  - Option to print ticket slip (if thermal printer connected)

### 6. Queue Display Board

Create `app/routes/kiosk.$deviceId.queue-display.tsx`:

- `app/components/kiosk/queue-display.tsx`:
  - Large screen display for waiting area
  - "Now Serving" section: current ticket numbers per counter
  - "Next Up" section: next 5 tickets in queue
  - Average wait time display
  - Auto-refreshes via polling (5-second interval)
  - Audio chime when new ticket called
  - Configurable branding (event logo, colors)

### 7. Kiosk Admin Management UI

Create routes and components:

- `app/routes/events.$eventId.settings.kiosks.tsx` — device management page
- `app/components/kiosk/device-list.tsx` — table with name, location, mode, online status, last heartbeat
- `app/components/kiosk/register-device-dialog.tsx` — registration form (name, location, mode, language)
- `app/components/kiosk/device-detail.tsx`:
  - Device info and configuration
  - Online/offline status with last heartbeat timestamp
  - Session count and usage statistics (lookups/hour, queue joins/hour)
  - "Generate Kiosk URL" button — produces URL with device token for browser lockdown

### 8. Queue Management UI (Staff)

- `app/routes/events.$eventId.queue.tsx` — staff queue management page
- `app/components/kiosk/queue-manager.tsx`:
  - Counter assignment (staff selects their counter number)
  - "Call Next" button — pulls next ticket by priority
  - Current ticket display with participant info
  - "Complete" and "No Show" buttons
  - Queue overview: total waiting, average wait, tickets served today

### 9. Feature Flag Gate

All kiosk features gated behind `FF_KIOSK_MODE`:

- Kiosk routes return 404 when disabled
- Device management hidden in settings
- Queue management hidden in navigation

---

## Acceptance Criteria

- [ ] Kiosk operates in fullscreen with touch-optimized UI (48px+ tap targets)
- [ ] Auto-reset to home screen after 120 seconds of inactivity
- [ ] Status lookup works via QR scan or email input
- [ ] Queue join assigns sequential ticket numbers with estimated wait time
- [ ] Queue display board shows "now serving" and "next up" with auto-refresh
- [ ] Audio chime on queue display when new ticket called
- [ ] Device heartbeat every 30 seconds, stale devices marked offline after 3 minutes
- [ ] Staff queue manager: call next, complete, no-show actions
- [ ] Device registration with name, location, mode, and language
- [ ] Kiosk admin dashboard shows device status and usage statistics
- [ ] Language selector with RTL support for Arabic
- [ ] Feature flag `FF_KIOSK_MODE` gates all functionality
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] Unit tests for queue management, session handling (≥6 test cases)
