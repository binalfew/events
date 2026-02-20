# INT-05: Custom Field Columns in Participant List

| Field            | Value                                      |
| ---------------- | ------------------------------------------ |
| Task ID          | INT-05                                     |
| Category         | Integration                                |
| Depends On       | INT-03                                     |
| Blocks           | —                                          |
| Estimated Effort | S                                          |
| Module Refs      | 01 Data Model, 02 Dynamic Schema, 08 UI/UX |

## Context

The participant list page currently shows only fixed columns (name, email, status). However, each event can define custom fields via `FieldDefinition` that store data in the participant's JSONB `extras` column. Admins need to see these custom field values directly in the list table and filter participants by them — without requiring navigation to each participant's detail page.

This task modifies the existing `participants/index.tsx` to dynamically add table columns and filter controls based on the event's `FieldDefinition` records.

## Deliverables

1. **Modify loader** in `app/routes/admin/events/$eventId/participants/index.tsx`:
   - Fetch the event's `FieldDefinition` records (ordered by `position`)
   - Optionally filter to only those marked `showInList: true` (if that metadata flag exists) or include all
   - Pass field definitions to the client alongside the participant list
   - Support query-string filter parameters for extras fields (e.g., `?extras.country=ET&extras.role=Speaker`)

2. **Dynamic table columns**:
   - After the fixed columns (name, email, organization, status), render one additional column per returned `FieldDefinition`
   - Column header uses the field's `label`
   - Cell value is extracted from `participant.extras[fieldDefinition.key]` and formatted according to field type:
     - `TEXT` / `TEXTAREA`: plain text (truncated if long)
     - `SELECT`: display the selected option's label
     - `CHECKBOX`: Yes/No or a checkmark icon
     - `DATE`: formatted date string
     - `NUMBER`: numeric display
   - Handle missing/null extras values gracefully (show "—")

3. **Dynamic filters**:
   - Add a filter bar or collapsible filter panel above the table
   - For each `FieldDefinition` of type `SELECT`, render a dropdown filter
   - For `TEXT` fields, render a search input (debounced, submits as query param)
   - For `CHECKBOX` fields, render a Yes/No/All toggle
   - Filters submit as URL search params so they compose with pagination and are bookmarkable
   - The loader applies these filters when querying participants (using Prisma's `path` JSON filtering or raw SQL GIN-indexed queries)

4. **Column visibility toggle** (optional enhancement):
   - A dropdown menu that lets admins show/hide specific custom columns
   - Persist preference in a cookie or URL param

## Acceptance Criteria

- [ ] The participant list table includes dynamic columns for the event's custom `FieldDefinition` records
- [ ] Column headers match field labels and cell values are formatted correctly by type
- [ ] Missing extras values display a dash or placeholder rather than errors
- [ ] At least SELECT-type fields have a working dropdown filter above the table
- [ ] Applying a filter updates the URL search params and the displayed participant list
- [ ] Filters compose correctly (multiple active filters narrow results with AND logic)
- [ ] typecheck passes
