# INT-03: Participant Detail Page

| Field            | Value                                                        |
| ---------------- | ------------------------------------------------------------ |
| Task ID          | INT-03                                                       |
| Category         | Integration                                                  |
| Depends On       | INT-02                                                       |
| Blocks           | INT-04, INT-05, INT-06                                       |
| Estimated Effort | M                                                            |
| Module Refs      | 01 Data Model, 03 Workflow Engine, 08 UI/UX, 09 Registration |

## Context

Once participants can be registered (INT-02), admins need a detail view to see all of a participant's data and take workflow actions on their record. This page displays the full participant profile — both fixed columns (name, email, organization) and dynamic `extras` fields — and exposes workflow transitions (e.g., approve, reject, request changes) based on the participant's current workflow state.

This route becomes the central hub for participant management and is a prerequisite for editing (INT-04), list enhancements (INT-05), and form-based registration (INT-06).

## Deliverables

1. **New route**: `app/routes/admin/events/$eventId/participants/$participantId/index.tsx`
   - **Loader**:
     - Fetch the participant by ID (with tenant + event guards)
     - Fetch the event's `FieldDefinition` records to label and render extras values
     - Fetch the participant's current workflow state (if workflow engine is active for this event)
     - Return participant data, field definitions, and available workflow transitions
   - **Action**:
     - Handle workflow transition submissions (e.g., form with `intent: "approve"`, `"reject"`, `"request-changes"`)
     - Call the workflow engine service to advance the participant's state
     - Return updated state or redirect back to the detail page

2. **Detail UI**:
   - **Fixed fields section**: Display name, email, organization, title, registration date, and current status in a structured layout (e.g., description list or card grid)
   - **Dynamic fields section**: Iterate over `FieldDefinition` records and display each extras value with its label, formatted according to field type (text, date, select, checkbox, etc.)
   - **Workflow actions panel**: Show the current workflow state with a badge and render buttons for each available transition (conditionally, based on user permissions)
   - **Navigation**: Back link to participants list, Edit button linking to INT-04's route

3. **Service layer** (if not already present):
   - `getParticipant({ tenantId, eventId, participantId })` — returns participant with extras
   - `transitionParticipantWorkflow({ participantId, transition })` — applies a workflow action

4. **Navigation link**:
   - Make participant names/rows clickable in `participants/index.tsx`, linking to the detail page

## Acceptance Criteria

- [ ] Navigating to `/admin/events/<eventId>/participants/<participantId>` shows the full participant profile
- [ ] Fixed fields (name, email, organization, title) are displayed correctly
- [ ] Dynamic extras fields are displayed with correct labels and formatted values from FieldDefinition metadata
- [ ] Current workflow state is shown with a visual badge
- [ ] Available workflow transitions are rendered as action buttons
- [ ] Clicking a workflow action updates the participant's state and reflects the change on the page
- [ ] Participant rows in the list page link to this detail page
- [ ] An "Edit" button is present and links to the edit route
- [ ] typecheck passes
