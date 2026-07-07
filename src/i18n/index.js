// i18next initialization (bilingual: English + Arabic with RTL).
// Imported once from src/index.js before the app renders.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ar from './locales/ar.json';

export const SUPPORTED_LANGS = ['en', 'ar'];
export const RTL_LANGS = ['ar'];

export function isRtlLang(lng) {
  return RTL_LANGS.includes(String(lng || '').split('-')[0]);
}

// Keep <html dir/lang> in sync with the active language so CSS and screen
// readers get the correct direction. MUI/Emotion RTL is handled separately in App.js.
export function applyDocumentDirection(lng) {
  try {
    const base = String(lng || 'en').split('-')[0];
    document.documentElement.setAttribute('dir', isRtlLang(base) ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', base);
  } catch (_) { /* non-browser env */ }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGS,
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false }, // React already escapes
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'lang',
      caches: ['localStorage'],
    },
  });

// Apply direction on load and on every subsequent language change.
applyDocumentDirection(i18n.resolvedLanguage || i18n.language);
i18n.on('languageChanged', applyDocumentDirection);

export default i18n;
