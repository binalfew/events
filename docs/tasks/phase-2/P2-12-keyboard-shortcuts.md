# P2-12: Keyboard Shortcuts

| Field                  | Value                                                                    |
| ---------------------- | ------------------------------------------------------------------------ |
| **Task ID**            | P2-12                                                                    |
| **Phase**              | 2 — Visual Form Designer + UX                                            |
| **Category**           | UX                                                                       |
| **Suggested Assignee** | Frontend Developer                                                       |
| **Depends On**         | None (independent)                                                       |
| **Blocks**             | —                                                                        |
| **Estimated Effort**   | 3 days                                                                   |
| **Module References**  | [Module 08 §Shortcuts](../../modules/08-UI-UX-AND-FRONTEND.md#shortcuts) |

---

## Context

Power users processing hundreds of accreditation requests need keyboard shortcuts for efficient workflow navigation. This task adds hotkeys for the approval workflow and a shortcut help dialog.

---

## Deliverables

### 1. Keyboard Shortcut System

Create `app/lib/use-keyboard-shortcuts.ts`:

- `useKeyboardShortcuts(shortcuts, options?)` — React hook
- Automatically disabled when focus is in text inputs, textareas, or contenteditable
- Modifier key support: Ctrl/Cmd, Shift, Alt
- Chord support: e.g., `g` then `e` for "Go to Events"

### 2. Workflow Shortcuts

| Key        | Action                      | Context          |
| ---------- | --------------------------- | ---------------- |
| `A`        | Approve current participant | Validation queue |
| `R`        | Reject current participant  | Validation queue |
| `B`        | Bypass current step         | Validation queue |
| `N` or `→` | Next participant            | Validation queue |
| `P` or `←` | Previous participant        | Validation queue |
| `?`        | Open shortcut help dialog   | Global           |

### 3. Navigation Shortcuts

| Key             | Action                        |
| --------------- | ----------------------------- |
| `⌘K` / `Ctrl+K` | Open command palette (search) |
| `g` then `d`    | Go to Dashboard               |
| `g` then `e`    | Go to Events                  |
| `g` then `s`    | Go to Settings                |
| `g` then `n`    | Go to Notifications           |

### 4. Form Designer Shortcuts

| Key                    | Action                 |
| ---------------------- | ---------------------- |
| `⌘Z` / `Ctrl+Z`        | Undo                   |
| `⌘⇧Z` / `Ctrl+Shift+Z` | Redo                   |
| `⌘S` / `Ctrl+S`        | Save form              |
| `Delete` / `Backspace` | Remove selected field  |
| `Esc`                  | Deselect / close panel |

### 5. Shortcut Help Dialog

Create `app/components/layout/shortcut-help.tsx`:

- Modal triggered by `?` key
- Grouped by context: Global, Workflow, Designer
- Shows key combination + description
- Searchable

### 6. Shortcut Indicator

- Show keyboard shortcut hints in tooltips (e.g., button tooltip: "Approve (A)")
- Optional shortcut badges on buttons in validation queue

---

## Acceptance Criteria

- [ ] All listed shortcuts functional
- [ ] Shortcuts disabled when typing in inputs
- [ ] `?` opens help dialog showing all shortcuts
- [ ] Chord shortcuts work (g then e)
- [ ] Modifier keys work cross-platform (Cmd on Mac, Ctrl on Windows)
- [ ] Tooltips show shortcut hints
- [ ] Feature flag `FF_KEYBOARD_SHORTCUTS` gates the feature
- [ ] User preference to disable shortcuts (stored in settings)
- [ ] No conflicts with browser defaults
