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

export const supportedLanguages = [
  { code: "en", name: "English", dir: "ltr" as const },
  { code: "fr", name: "Fran\u00e7ais", dir: "ltr" as const },
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]["code"];

export function getLanguageDir(lang: string): "ltr" | "rtl" {
  return "ltr";
}

const resources = {
  en: { common: enCommon, nav: enNav, auth: enAuth },
  fr: { common: frCommon, nav: frNav, auth: frAuth },
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
