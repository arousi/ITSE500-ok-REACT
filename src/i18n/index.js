// i18next initialization (bilingual: English + Arabic with RTL).
// Imported once from src/index.js before the app renders.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ar from './locales/ar.json';
import enApp from './locales/en/app.json';
import arApp from './locales/ar/app.json';
import { SUPPORTED_LANGS, RTL_LANGS, isRtlLang, applyDocumentDirection } from './direction';

// Re-exported so existing imports from '../i18n' keep working.
export { SUPPORTED_LANGS, RTL_LANGS, isRtlLang, applyDocumentDirection };

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: { ...en, nav: { ...en.nav, ...enApp.nav }, dashboard: enApp.dashboard, chat: enApp.chat } },
      ar: { translation: { ...ar, nav: { ...ar.nav, ...arApp.nav }, dashboard: arApp.dashboard, chat: arApp.chat } },
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
