// Pure language-direction helpers, with NO i18next dependency, so they can be
// unit-tested without initializing the full i18n stack. Re-exported from ./index.
export const SUPPORTED_LANGS = ['en', 'ar'];
export const RTL_LANGS = ['ar'];

export function isRtlLang(lng) {
  return RTL_LANGS.includes(String(lng || '').split('-')[0]);
}

// Keep <html dir/lang> in sync with the active language so CSS and screen
// readers get the correct direction. MUI/Emotion RTL is handled in App.js.
export function applyDocumentDirection(lng) {
  try {
    const base = String(lng || 'en').split('-')[0];
    document.documentElement.setAttribute('dir', isRtlLang(base) ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', base);
  } catch (_) { /* non-browser env */ }
}
