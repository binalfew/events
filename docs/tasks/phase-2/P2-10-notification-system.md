# P2-10: Notification System

| Field                  | Value                                                                            |
| ---------------------- | -------------------------------------------------------------------------------- |
| **Task ID**            | P2-10                                                                            |
| **Phase**              | 2 — Visual Form Designer + UX                                                    |
| **Category**           | Feature                                                                          |
| **Suggested Assignee** | Frontend Developer + Backend Developer                                           |
| **Depends On**         | P2-09 (SSE Real-Time Updates)                                                    |
| **Blocks**             | —                                                                                |
| **Estimated Effort**   | 5 days                                                                           |
| **Module References**  | [Module 08 §Notifications](../../modules/08-UI-UX-AND-FRONTEND.md#notifications) |

---

## Context

The top navbar already has a bell icon placeholder. This task wires it up with a persistent notification model, unread count, and SSE push so users see relevant events without polling.

---

## Deliverables

### 1. Prisma Model

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  tenantId  String
  type      String              // approval_required, sla_warning, form_published, etc.
  title     String
  message   String
  data      Json?               // arbitrary payload (participantId, eventId, etc.)
  read      Boolean  @default(false)
  readAt    DateTime?
  createdAt DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([userId, read])
  @@index([userId, createdAt])
  @@index([tenantId])
}
```

### 2. Notification Service

Create `app/services/notifications.server.ts`:

- `createNotification(input)` — create + publish SSE event
- `getUnreadCount(userId)` — count unread
- `listNotifications(userId, filters?)` — paginated list
- `markAsRead(id, userId)` — mark single as read
- `markAllAsRead(userId)` — mark all as read
- `deleteNotification(id, userId)` — delete

### 3. Notification Triggers

Create notifications on:

- Participant status change (for assigned reviewer)
- SLA breach warning (for step assignee)
- Form published (for event admins)
- Account lockout attempt (for admins)

### 4. Bell Icon & Dropdown

Update the existing bell icon in `top-navbar.tsx`:

- Unread count badge (red circle with number)
- Click opens dropdown with recent notifications (last 10)
- Each notification: icon, title, message, time ago, read/unread indicator
- "Mark all as read" action
- "View all" link to full notification center page

### 5. Notification Center Page

Create `/admin/notifications` route:

- Full list of notifications with pagination
- Filter by: type, read/unread, date range
- Bulk mark as read / delete
- Empty state when no notifications

### 6. SSE Integration

- New notifications push via SSE to update bell count in real time
- Toast shown for high-priority notifications (SLA breach, account lockout)

---

## Acceptance Criteria

- [ ] Notification model created with migration
- [ ] Notifications created on defined trigger events
- [ ] Bell icon shows unread count badge
- [ ] Dropdown shows recent notifications
- [ ] Mark as read / mark all as read works
- [ ] Notification center page with filters and pagination
- [ ] SSE pushes new notifications in real time
- [ ] Toast shown for high-priority notifications
- [ ] Feature flag `FF_NOTIFICATIONS` gates the feature
