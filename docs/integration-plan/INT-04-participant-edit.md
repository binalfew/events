# INT-04: Participant Edit Page

| Field            | Value                                                       |
| ---------------- | ----------------------------------------------------------- |
| Task ID          | INT-04                                                      |
| Category         | Integration                                                 |
| Depends On       | INT-03                                                      |
| Blocks           | —                                                           |
| Estimated Effort | M                                                           |
| Module Refs      | 01 Data Model, 02 Dynamic Schema, 08 UI/UX, 09 Registration |

## Context

With the participant detail page in place (INT-03), admins need the ability to edit participant data. This task reuses the same form infrastructure built for registration in INT-02 — FieldRenderer, the runtime schema builder, and `parseFieldFormData` — but pre-populates the form with existing participant data (both fixed columns and JSONB extras). This ensures a consistent editing experience where validation rules match exactly what was enforced at creation time.

## Deliverables

1. **New route**: `app/routes/admin/events/$eventId/participants/$participantId/edit.tsx`
   - **Loader**:
     - Fetch the participant by ID (with tenant + event guards)
     - Fetch the event's `FieldDefinition` records (ordered by `position`)
     - Merge fixed fields and extras into a single default-values object suitable for Conform
     - Return participant data, field definitions, and default values
   - **Action**:
     - Build a Zod schema at runtime from the event's `FieldDefinition` records (same approach as INT-02)
     - Parse the submitted `FormData` using `parseFieldFormData`
     - Validate against the generated schema via Conform's `parseWithZod`
     - On success, update the `Participant` record (fixed fields + JSONB `extras`)
     - Redirect to the participant detail page

2. **Form UI**:
   - Reuse the same form layout structure from `participants/new.tsx` (INT-02)
   - Pre-populate all fixed field inputs with the participant's current values
   - Pre-populate all dynamic field inputs by passing current extras values to `FieldRenderer` via `defaultValue`
   - Show validation errors inline on submission failure
   - Include "Save" and "Cancel" buttons (cancel links back to the detail page)

3. **Shared form component** (optional but recommended):
   - Extract the participant form (fixed fields + dynamic FieldRenderer loop) into a shared component like `app/components/participant-form.tsx`
   - Both `new.tsx` and `edit.tsx` can use this component, differing only in default values and submit action
   - This avoids duplicating the form layout and keeps field ordering consistent

4. **Service layer**:
   - `updateParticipant({ tenantId, eventId, participantId, data, extras })` — updates fixed columns and JSONB extras

## Acceptance Criteria

- [ ] Navigating to `/admin/events/<eventId>/participants/<participantId>/edit` renders the edit form
- [ ] All fixed fields are pre-populated with the participant's current values
- [ ] All dynamic fields are pre-populated with the participant's current extras values
- [ ] Validation rules match those applied during creation (same schema builder output)
- [ ] Submitting valid changes updates the participant record (both fixed and extras)
- [ ] Validation errors display inline for invalid fields
- [ ] After successful update, user is redirected to the participant detail page
- [ ] The "Edit" button on the detail page (INT-03) links to this route
- [ ] typecheck passes
