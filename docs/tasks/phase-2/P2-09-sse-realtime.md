# P2-09: SSE Real-Time Updates

| Field                  | Value                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| **Task ID**            | P2-09                                                               |
| **Phase**              | 2 — Visual Form Designer + UX                                       |
| **Category**           | UX                                                                  |
| **Suggested Assignee** | Backend Developer                                                   |
| **Depends On**         | None (independent)                                                  |
| **Blocks**             | P2-10 (Notification System)                                         |
| **Estimated Effort**   | 5 days                                                              |
| **Module References**  | [Module 07 §SSE](../../modules/07-API-AND-INTEGRATION-LAYER.md#sse) |

---

## Context

Validator queues and dashboards currently require manual page refreshes to see new data. SSE (Server-Sent Events) provides a lightweight, HTTP-native push mechanism for real-time updates without the complexity of WebSockets.

---

## Deliverables

### 1. SSE Server Endpoint

Create SSE route in Express (`server/sse.ts`):

- `GET /api/sse?channels=validation,notifications`
- Set headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
- Heartbeat every 30 seconds (`:keepalive\n\n`)
- Client authentication via session cookie
- Tenant isolation: clients only receive events for their tenant

### 2. Event Bus

Create `server/event-bus.ts`:

- In-memory pub/sub for server-side event broadcasting
- `publish(channel, event)` — broadcast to all connected clients on channel
- `subscribe(channel, callback)` — register client listener
- `unsubscribe(channel, callback)` — remove client listener
- Channel types: `validation`, `notifications`, `dashboard`

### 3. Event Types

```typescript
type SSEEvent =
  | { type: "participant:created"; data: { id: string; name: string; eventId: string } }
  | { type: "participant:approved"; data: { id: string; name: string; approvedBy: string } }
  | { type: "participant:rejected"; data: { id: string; name: string; rejectedBy: string } }
  | { type: "sla:overdue"; data: { participantId: string; stepName: string } }
  | { type: "notification:new"; data: { id: string; title: string; message: string } };
```

### 4. Publish Integration

Add event publishing to existing services:

- Workflow navigation (approve/reject) → publish to `validation` channel
- SLA checker → publish to `dashboard` channel
- Notification creation → publish to `notifications` channel

### 5. Client Hook

Create `app/lib/use-sse.ts`:

- `useSSE(channels, onEvent)` — React hook for SSE connection
- Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Connection state: connecting, connected, disconnected
- Cleanup on unmount
- Feature flag `FF_SSE_UPDATES` gates activation

### 6. Toast Integration

Show toast notifications on SSE events:

- "John Doe approved by Admin" (validation channel)
- "3 participants overdue" (dashboard channel)
- Use existing toast/notification UI pattern

---

## Acceptance Criteria

- [ ] SSE endpoint establishes connection with heartbeat
- [ ] Events broadcast only to clients in the same tenant
- [ ] Client reconnects automatically after disconnection
- [ ] Validation queue updates in real time (no page refresh)
- [ ] Toast notifications appear for relevant events
- [ ] No memory leaks on page navigation (proper cleanup)
- [ ] Connection state visible in UI (optional indicator)
- [ ] Feature flag `FF_SSE_UPDATES` gates the feature
- [ ] Works behind reverse proxy (nginx, CloudFront)
