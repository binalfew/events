# P3-09: PWA Shell & Responsive Views

| Field                  | Value                                                      |
| ---------------------- | ---------------------------------------------------------- |
| **Task ID**            | P3-09                                                      |
| **Phase**              | 3 — Advanced Features                                      |
| **Category**           | Infrastructure                                             |
| **Suggested Assignee** | Senior Frontend Engineer                                   |
| **Depends On**         | P3-00                                                      |
| **Blocks**             | P3-10 (Offline Mode & Sync)                                |
| **Estimated Effort**   | 4 days                                                     |
| **Module References**  | [Module 06](../../modules/06-INFRASTRUCTURE-AND-DEVOPS.md) |

---

## Context

Badge printing, collection, and scanning often happen in venues with unreliable connectivity. A Progressive Web App (PWA) allows the platform to be installed on tablets and phones, with service worker caching for fast loads and eventual offline support (P3-10). This task sets up the PWA shell: manifest, service worker, install prompt, and responsive mobile layouts.

---

## Deliverables

### 1. Web App Manifest

Create `public/manifest.json`:

```json
{
  "name": "Accreditation Platform",
  "short_name": "Accredit",
  "description": "Multi-tenant event accreditation platform",
  "start_url": "/admin",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0f172a",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### 2. App Icons

Create `public/icons/`:

- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- `icon-maskable-512.png` (512x512, with safe zone padding)
- `apple-touch-icon.png` (180x180, for iOS)

Use a simple geometric logo placeholder (letter "A" in a rounded square).

### 3. Service Worker

Create `app/sw.ts` (compiled by Vite to `public/sw.js`):

Using Workbox library patterns (or manual implementation):

- **Cache-first** for static assets: CSS, JS bundles, fonts, images
- **Network-first** for API routes: `/api/*`
- **Stale-while-revalidate** for HTML pages
- **Cache versioning**: include build hash in cache name for clean updates
- **Precaching**: critical shell assets (app shell HTML, main CSS/JS)
- **Cleanup**: delete old caches on activation

```typescript
// Cache strategies
const STATIC_CACHE = "static-v1";
const API_CACHE = "api-v1";
const PAGE_CACHE = "pages-v1";

// Install: precache shell
self.addEventListener("install", (event) => { ... });

// Activate: clean old caches
self.addEventListener("activate", (event) => { ... });

// Fetch: route to appropriate strategy
self.addEventListener("fetch", (event) => { ... });
```

### 4. Service Worker Registration

Update `app/entry.client.tsx` or `app/root.tsx`:

- Register service worker on client hydration
- Only register when `FF_PWA` feature flag is enabled
- Handle updates: prompt user to reload when new SW available

### 5. Install Prompt Component

Create `app/components/pwa/install-prompt.tsx`:

- Listen for `beforeinstallprompt` event
- Show dismissible banner: "Install this app for a better experience"
- "Install" button triggers native install dialog
- "Dismiss" button hides for current session (persist in sessionStorage)
- Only show on mobile/tablet or when in browser (not standalone)

### 6. Root Layout Updates

Update `app/root.tsx`:

- Add `<link rel="manifest" href="/manifest.json">` in head
- Add `<meta name="theme-color" content="#0f172a">` (and dark mode variant)
- Add `<meta name="apple-mobile-web-app-capable" content="yes">`
- Add `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">`
- iOS splash screens (optional, stretch goal)

### 7. Responsive Mobile Layouts

Ensure existing UI components work well on mobile:

- Sidebar: collapsible drawer on mobile (< 768px), overlay mode
- Top navbar: compact layout, hamburger menu
- Data tables: horizontal scroll on small screens, or card view
- Forms: single-column layout on mobile
- Dialogs: full-screen on mobile
- Touch targets: minimum 44x44px

### 8. Feature Flag Gate

PWA features gated behind `FF_PWA`:

- Service worker not registered when disabled
- Install prompt hidden
- Manifest link not included in HTML head

---

## Acceptance Criteria

- [ ] `manifest.json` served correctly with app metadata and icons
- [ ] Service worker registers and caches static assets
- [ ] Cache-first strategy serves cached statics when offline
- [ ] Network-first strategy fetches fresh API data when online
- [ ] Install prompt appears on mobile browsers
- [ ] App installable (passes Lighthouse PWA checks)
- [ ] Responsive layouts work on mobile (320px – 768px)
- [ ] Touch targets are at least 44x44px
- [ ] Feature flag `FF_PWA` gates service worker registration
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
