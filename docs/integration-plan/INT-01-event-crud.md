# INT-01: Event CRUD UI

| Field            | Value                   |
| ---------------- | ----------------------- |
| Task ID          | INT-01                  |
| Category         | Integration             |
| Depends On       | —                       |
| Blocks           | INT-02                  |
| Estimated Effort | S                       |
| Module Refs      | 01 Data Model, 08 UI/UX |

## Context

Events currently can only be created via seed data. Admins need a UI to create and edit events.

## Deliverables

1. **Zod schema**: `app/lib/schemas/event.ts` — createEventSchema, updateEventSchema
2. **Service**: `app/services/events.server.ts` — createEvent, updateEvent, getEvent
3. **New route**: `app/routes/admin/events/new.tsx` — form to create event
4. **Edit route**: `app/routes/admin/events/$eventId/edit.tsx` — form to edit event
5. **Modify**: `app/routes/admin/events/index.tsx` — add "New Event" button + "Edit" link per card

## Acceptance Criteria

- [ ] Can navigate to `/admin/events/new` and create an event
- [ ] New event appears in the events list
- [ ] Can click "Edit" on an event card and update its details
- [ ] Form validates required fields (name, dates)
- [ ] typecheck passes
