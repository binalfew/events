# P3-01: Internationalization (i18n)

| Field                  | Value                                               |
| ---------------------- | --------------------------------------------------- |
| **Task ID**            | P3-01                                               |
| **Phase**              | 3 — Advanced Features                               |
| **Category**           | i18n                                                |
| **Suggested Assignee** | Senior Frontend Engineer                            |
| **Depends On**         | P3-00                                               |
| **Blocks**             | None                                                |
| **Estimated Effort**   | 6 days                                              |
| **Module References**  | [Module 08](../../modules/08-UI-UX-AND-FRONTEND.md) |

---

## Context

The platform currently has all strings hardcoded in English. The African Union context requires support for at least English, French, Amharic, and Arabic (RTL). This task adds full i18n infrastructure using `react-i18next`, with cookie-based language persistence for SSR compatibility.

---

## Deliverables

### 1. Install Dependencies

```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

### 2. i18n Configuration

Create `app/lib/i18n.ts`:

- Initialize `i18next` with `react-i18next` and `LanguageDetector`
- Support 4 locales: `en`, `fr`, `am`, `ar`
- Translation namespaces: `common`, `nav`, `auth`
- Cookie-based detection (`i18n_lang` cookie) for SSR compatibility
- Export helpers: `supportedLanguages`, `getLanguageDir()`, `RTL_LANGUAGES`
- Singleton initialization guard (only init once)

### 3. Translation Files

Create locale files under `app/locales/{en,fr,am,ar}/`:

**`common.json`** — shared UI strings:

- Buttons: save, cancel, delete, edit, create, submit, confirm, close, back, next
- Status labels: pending, approved, rejected, inProgress, draft, published, archived, active, inactive
- Misc: search, loading, noResults, actions, status, profile, signOut, language

**`nav.json`** — sidebar and navigation:

- Group labels: main, management, operations, administration
- All nav items: dashboard, notifications, events, participants, workflows, logistics, reports, users, settings
- All sub-items: allEvents, forms, categories, templates, etc.

**`auth.json`** — login/logout:

- login, logout, email, password, forgotPassword, rememberMe, loginTitle, loginSubtitle

### 4. RTL Support

- `getLanguageDir(lang)` returns `"rtl"` for Arabic, `"ltr"` for others
- `<html>` element receives `dir` and `lang` attributes dynamically
- Cookie `i18n_lang` read in root loader for SSR-correct initial render

### 5. Language Switcher Component

Create `app/components/layout/language-switcher.tsx`:

- Dropdown with `Languages` icon from lucide-react
- Lists all supported languages with code + native name
- Highlights current language
- On selection: changes i18n language, persists cookie, updates `document.documentElement.dir` and `document.documentElement.lang`

### 6. Integration

- Update `app/root.tsx`:
  - Read `i18n_lang` cookie in loader, return `language` to client
  - Set `lang` and `dir` attributes on `<html>` element
  - Call `initI18n(language)` in Layout component
- Update `app/routes/admin/_layout.tsx`:
  - Check `FF_I18N` feature flag, pass `i18nEnabled` to TopNavbar
- Update `app/components/layout/top-navbar.tsx`:
  - Accept `i18nEnabled` prop
  - Render `<LanguageSwitcher />` when `i18nEnabled` is true

### 7. Feature Flag Gate

All i18n features gated behind `FF_I18N`. When disabled:

- Language switcher hidden
- English used as default
- No RTL changes applied

---

## Acceptance Criteria

- [ ] `react-i18next`, `i18next`, `i18next-browser-languagedetector` installed
- [ ] Translation files exist for all 4 locales (en, fr, am, ar) with 3 namespaces each
- [ ] Language switcher dropdown appears when `FF_I18N` is enabled
- [ ] Switching language updates UI strings without page reload
- [ ] Language persisted in cookie; page refresh retains language choice
- [ ] Arabic selection sets `dir="rtl"` on `<html>` element
- [ ] SSR renders correct language based on cookie (no flash of wrong language)
- [ ] Feature flag `FF_I18N` gates the language switcher visibility
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
