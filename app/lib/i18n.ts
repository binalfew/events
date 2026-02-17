import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// English
import enCommon from "~/locales/en/common.json";
import enNav from "~/locales/en/nav.json";
import enAuth from "~/locales/en/auth.json";

// French
import frCommon from "~/locales/fr/common.json";
import frNav from "~/locales/fr/nav.json";
import frAuth from "~/locales/fr/auth.json";

// Amharic
import amCommon from "~/locales/am/common.json";
import amNav from "~/locales/am/nav.json";
import amAuth from "~/locales/am/auth.json";

// Arabic
import arCommon from "~/locales/ar/common.json";
import arNav from "~/locales/ar/nav.json";
import arAuth from "~/locales/ar/auth.json";

export const supportedLanguages = [
  { code: "en", name: "English", dir: "ltr" as const },
  { code: "fr", name: "Fran\u00e7ais", dir: "ltr" as const },
  { code: "am", name: "\u12A0\u121B\u122D\u129B", dir: "ltr" as const },
  { code: "ar", name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", dir: "rtl" as const },
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]["code"];

export const RTL_LANGUAGES = new Set(["ar"]);

export function getLanguageDir(lang: string): "ltr" | "rtl" {
  return RTL_LANGUAGES.has(lang) ? "rtl" : "ltr";
}

const resources = {
  en: { common: enCommon, nav: enNav, auth: enAuth },
  fr: { common: frCommon, nav: frNav, auth: frAuth },
  am: { common: amCommon, nav: amNav, auth: amAuth },
  ar: { common: arCommon, nav: arNav, auth: arAuth },
};

let initialized = false;

export function initI18n(language?: string) {
  if (initialized) {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
    return i18n;
  }

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "en",
      defaultNS: "common",
      ns: ["common", "nav", "auth"],
      ...(language ? { lng: language } : {}),
      detection: {
        order: ["cookie", "navigator"],
        lookupCookie: "i18n_lang",
        caches: ["cookie"],
        cookieMinutes: 525600, // 1 year
      },
      interpolation: {
        escapeValue: false, // React already escapes
      },
    });

  initialized = true;
  return i18n;
}

export default i18n;
