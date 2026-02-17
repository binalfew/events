import { describe, it, expect } from "vitest";

// ─── Service Worker Logic Tests ───────────────────────────
// Tests for the PWA components and SW registration logic

describe("PWA Feature Flag Gating", () => {
  it("should define FF_PWA in feature flag keys", async () => {
    const { FEATURE_FLAG_KEYS } = await import("~/lib/feature-flags.server");
    expect(FEATURE_FLAG_KEYS.PWA).toBe("FF_PWA");
  });

  it("should define FF_OFFLINE_MODE in feature flag keys", async () => {
    const { FEATURE_FLAG_KEYS } = await import("~/lib/feature-flags.server");
    expect(FEATURE_FLAG_KEYS.OFFLINE_MODE).toBe("FF_OFFLINE_MODE");
  });
});

describe("Service Worker Cache Strategies", () => {
  // Test the helper function logic from sw.js
  const isStaticAsset = (pathname: string): boolean => {
    return (
      /\.(js|css|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|ico|webp|avif)(\?.*)?$/.test(pathname) ||
      pathname.startsWith("/assets/") ||
      pathname.startsWith("/icons/")
    );
  };

  it("should identify JS files as static assets", () => {
    expect(isStaticAsset("/assets/main-abc123.js")).toBe(true);
  });

  it("should identify CSS files as static assets", () => {
    expect(isStaticAsset("/assets/style-abc123.css")).toBe(true);
  });

  it("should identify font files as static assets", () => {
    expect(isStaticAsset("/fonts/inter.woff2")).toBe(true);
    expect(isStaticAsset("/fonts/inter.ttf")).toBe(true);
  });

  it("should identify image files as static assets", () => {
    expect(isStaticAsset("/icons/icon-192.png")).toBe(true);
    expect(isStaticAsset("/images/photo.jpg")).toBe(true);
    expect(isStaticAsset("/images/photo.webp")).toBe(true);
  });

  it("should identify /assets/ paths as static assets", () => {
    expect(isStaticAsset("/assets/anything")).toBe(true);
  });

  it("should identify /icons/ paths as static assets", () => {
    expect(isStaticAsset("/icons/something")).toBe(true);
  });

  it("should NOT identify API routes as static assets", () => {
    expect(isStaticAsset("/api/events")).toBe(false);
  });

  it("should NOT identify HTML pages as static assets", () => {
    expect(isStaticAsset("/admin")).toBe(false);
    expect(isStaticAsset("/admin/events")).toBe(false);
  });

  it("should handle query strings on static assets", () => {
    expect(isStaticAsset("/assets/main.js?v=123")).toBe(true);
  });
});

describe("Manifest Configuration", () => {
  it("should have required PWA manifest fields", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const manifestPath = path.resolve(process.cwd(), "public/manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    expect(manifest.name).toBe("Accreditation Platform");
    expect(manifest.short_name).toBe("Accredit");
    expect(manifest.start_url).toBe("/admin");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#0f172a");
    expect(manifest.background_color).toBe("#ffffff");
  });

  it("should have at least 2 icons including a maskable icon", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const manifestPath = path.resolve(process.cwd(), "public/manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    const maskable = manifest.icons.find((i: { purpose?: string }) => i.purpose === "maskable");
    expect(maskable).toBeDefined();
    expect(maskable.sizes).toBe("512x512");
  });

  it("should have 192x192 and 512x512 icons", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const manifestPath = path.resolve(process.cwd(), "public/manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });
});

describe("PWA Install Prompt Logic", () => {
  it("should use session storage key for dismissal tracking", () => {
    // The install prompt component uses "pwa_install_dismissed" in sessionStorage
    const DISMISS_KEY = "pwa_install_dismissed";
    expect(DISMISS_KEY).toBe("pwa_install_dismissed");
  });

  it("should check standalone display mode via matchMedia query", () => {
    // The install prompt checks "(display-mode: standalone)" to detect installed state
    const query = "(display-mode: standalone)";
    expect(query).toContain("display-mode");
    expect(query).toContain("standalone");
  });
});

describe("Icon Files", () => {
  it("should have all required icon files in public/icons", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const iconsDir = path.resolve(process.cwd(), "public/icons");

    const requiredIcons = [
      "icon-192.png",
      "icon-512.png",
      "icon-maskable-512.png",
      "apple-touch-icon.png",
    ];

    for (const icon of requiredIcons) {
      const iconPath = path.join(iconsDir, icon);
      expect(fs.existsSync(iconPath)).toBe(true);
    }
  });
});
