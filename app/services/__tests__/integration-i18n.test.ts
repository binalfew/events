import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const LOCALES = ["en", "fr", "am", "ar"];
const RTL_LOCALES = ["ar"];
const NAMESPACES = ["common", "auth", "nav"];

describe("Integration: i18n", () => {
  describe("Locale files exist for all supported locales", () => {
    for (const locale of LOCALES) {
      for (const ns of NAMESPACES) {
        it(`should have ${locale}/${ns}.json`, () => {
          const filePath = path.resolve(process.cwd(), `app/locales/${locale}/${ns}.json`);
          expect(fs.existsSync(filePath)).toBe(true);
        });
      }
    }
  });

  describe("Translation key consistency", () => {
    for (const ns of NAMESPACES) {
      it(`should have matching keys across all locales for "${ns}"`, () => {
        const keysByLocale: Record<string, string[]> = {};

        for (const locale of LOCALES) {
          const filePath = path.resolve(process.cwd(), `app/locales/${locale}/${ns}.json`);
          const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          keysByLocale[locale] = Object.keys(content).sort();
        }

        const referenceKeys = keysByLocale["en"];
        for (const locale of LOCALES.filter((l) => l !== "en")) {
          expect(keysByLocale[locale]).toEqual(referenceKeys);
        }
      });
    }
  });

  describe("RTL direction", () => {
    it("should identify Arabic as RTL", async () => {
      const { getLanguageDir } = await import("~/lib/i18n");
      expect(getLanguageDir("ar")).toBe("rtl");
    });

    it("should identify English as LTR", async () => {
      const { getLanguageDir } = await import("~/lib/i18n");
      expect(getLanguageDir("en")).toBe("ltr");
    });

    it("should identify French as LTR", async () => {
      const { getLanguageDir } = await import("~/lib/i18n");
      expect(getLanguageDir("fr")).toBe("ltr");
    });

    it("should identify Amharic as LTR", async () => {
      const { getLanguageDir } = await import("~/lib/i18n");
      expect(getLanguageDir("am")).toBe("ltr");
    });
  });

  describe("Language cookie parsing", () => {
    it("should default to 'en' when no cookie is set", () => {
      const cookie = "";
      const match = cookie.match(/i18n_lang=([a-z]{2})/);
      expect(match?.[1] ?? "en").toBe("en");
    });

    it("should parse 'fr' from cookie", () => {
      const cookie = "i18n_lang=fr; other=value";
      const match = cookie.match(/i18n_lang=([a-z]{2})/);
      expect(match?.[1] ?? "en").toBe("fr");
    });

    it("should parse 'ar' from cookie", () => {
      const cookie = "sidebar_state=true; i18n_lang=ar";
      const match = cookie.match(/i18n_lang=([a-z]{2})/);
      expect(match?.[1] ?? "en").toBe("ar");
    });
  });
});
