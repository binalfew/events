# INT-06: Form Template-Based Registration

| Field            | Value                                                                                |
| ---------------- | ------------------------------------------------------------------------------------ |
| Task ID          | INT-06                                                                               |
| Category         | Integration                                                                          |
| Depends On       | INT-03                                                                               |
| Blocks           | —                                                                                    |
| Estimated Effort | M                                                                                    |
| Module Refs      | 01 Data Model, 02 Dynamic Schema, 03 Visual Form Designer, 08 UI/UX, 09 Registration |

## Context

INT-02 wires FieldRenderer directly to `FieldDefinition` records for a straightforward admin-side registration form. However, the platform also includes a Visual Form Designer that lets admins create rich, multi-section form templates with custom layouts, conditional logic, and section grouping. When one of these form templates is published for an event, it should serve as the registration form instead of (or in addition to) the raw field list approach.

This task creates a new route that renders a published form template as a complete registration form, preserving the designer's layout (sections, ordering, help text, conditional visibility) while still validating and storing data through the same schema builder and `parseFieldFormData` pipeline.

## Deliverables

1. **New route**: `app/routes/admin/events/$eventId/participants/register.tsx`
   - **Loader**:
     - Fetch the event (with tenant guard)
     - Fetch the event's published `FormTemplate` (status = `PUBLISHED`), including its sections and field mappings
     - If no published form template exists, redirect to `participants/new` (the basic registration route from INT-02)
     - Resolve each form field to its underlying `FieldDefinition` record for schema generation
     - Return the form template structure, resolved field definitions, and event metadata
   - **Action**:
     - Build a Zod schema from the form template's fields using the schema builder (same as INT-02 but scoped to the fields included in the template)
     - Parse `FormData` using `parseFieldFormData`
     - Validate and create the participant record
     - Redirect to the participant detail page or a confirmation screen

2. **Form template renderer**:
   - Render the form template's sections in order, each with its heading and optional description
   - Within each section, render fields in the designer-specified order using `FieldRenderer`
   - Apply conditional visibility rules: if a field has `visibleWhen` logic (e.g., show field B only when field A = "Yes"), evaluate the condition on the client and toggle visibility
   - Display section-level and field-level help text as configured in the form designer
   - Show validation errors inline within the correct section

3. **Multi-step support** (if the form template is configured for multi-step):
   - Render each section as a wizard step with Next/Previous navigation
   - Validate the current step's fields before allowing progression
   - Show a progress indicator (step N of M)
   - Final step includes a Review summary and Submit button

4. **Navigation and entry points**:
   - On the participants list page, if the event has a published form template, show a "Register via Form" button linking to this route
   - On the event detail/dashboard page, include a link to the registration form
   - If no published form template exists, the button falls back to the `participants/new` route

5. **Confirmation screen** (optional):
   - After successful registration, show a confirmation page with a summary of submitted data
   - Include a "Register Another" link and a "View Participant" link

## Acceptance Criteria

- [ ] Navigating to `/admin/events/<eventId>/participants/register` renders the published form template
- [ ] Form sections are displayed in the designer-specified order with headings and descriptions
- [ ] Fields within each section render correctly via FieldRenderer with proper ordering
- [ ] Conditional visibility rules show/hide fields based on other field values
- [ ] Submitting valid data creates a participant with correct fixed columns and JSONB extras
- [ ] Validation errors appear inline within the correct form section
- [ ] If no published form template exists, the user is redirected to the basic registration form
- [ ] The participants list page shows the appropriate registration button based on form template availability
- [ ] typecheck passes
