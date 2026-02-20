# INT-02: Participant Registration Form

| Field            | Value                                                       |
| ---------------- | ----------------------------------------------------------- |
| Task ID          | INT-02                                                      |
| Category         | Integration                                                 |
| Depends On       | INT-01                                                      |
| Blocks           | INT-03                                                      |
| Estimated Effort | M                                                           |
| Module Refs      | 01 Data Model, 02 Dynamic Schema, 08 UI/UX, 09 Registration |

## Context

With events now manageable through the CRUD UI (INT-01), the next step is letting admins register participants for an event. The platform already has three key building blocks that need to be wired together:

- **FieldRenderer** (`app/components/field-renderer.tsx`) — renders form inputs from `FieldDefinition` metadata
- **Schema builder** (`app/lib/schemas/dynamic.ts` or similar) — generates Zod schemas from `FieldDefinition` records at runtime
- **`parseFieldFormData`** — extracts submitted form data and maps it to fixed columns + JSONB `extras`

This task connects those pieces into a working registration form at `participants/new.tsx`, so that admins can add participants with both fixed fields (name, email, organization) and event-specific dynamic fields defined via `FieldDefinition`.

## Deliverables

1. **Loader** in `app/routes/admin/events/$eventId/participants/new.tsx`:
   - Fetch the event (with tenant guard)
   - Fetch all `FieldDefinition` records for this event (ordered by `position`)
   - Return event metadata + field definitions to the client

2. **Action** in the same route:
   - Build a Zod schema at runtime from the event's `FieldDefinition` records using the schema builder
   - Parse the submitted `FormData` using `parseFieldFormData` to separate fixed columns from extras
   - Validate against the generated schema via Conform's `parseWithZod`
   - On success, create a `Participant` record with fixed fields + JSONB `extras`
   - Redirect to the participant detail page (INT-03) or back to the participants list

3. **Form UI**:
   - Render fixed fields (first name, last name, email, organization, title) using standard Conform inputs
   - Render dynamic fields by iterating over `FieldDefinition` records and passing each to `FieldRenderer`
   - Show validation errors inline (both fixed and dynamic fields)
   - Include a submit button and a cancel link back to the participants list

4. **Navigation link**:
   - Add an "Add Participant" button on `app/routes/admin/events/$eventId/participants/index.tsx` that links to the `new` route

5. **Service layer** (if not already present):
   - `app/services/participants.server.ts` — `createParticipant({ tenantId, eventId, data, extras })`

## Acceptance Criteria

- [ ] Navigating to `/admin/events/<eventId>/participants/new` renders a form with both fixed and dynamic fields
- [ ] Dynamic fields match the `FieldDefinition` records configured for the event
- [ ] Submitting valid data creates a `Participant` with correct fixed columns and JSONB `extras`
- [ ] Validation errors display inline for required fields (both fixed and dynamic)
- [ ] After successful creation, user is redirected appropriately
- [ ] The "Add Participant" button is visible on the participants list page
- [ ] typecheck passes
