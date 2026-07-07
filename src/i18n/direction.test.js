import { isRtlLang, applyDocumentDirection } from './direction';

// Pins the riskiest new i18n behavior: correct RTL detection and the <html>
// dir/lang flip that drives all CSS/MUI direction.
describe('i18n/direction', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('dir');
    document.documentElement.removeAttribute('lang');
  });

  test('isRtlLang detects Arabic including region subtags', () => {
    expect(isRtlLang('ar')).toBe(true);
    expect(isRtlLang('ar-EG')).toBe(true);
    expect(isRtlLang('en')).toBe(false);
    expect(isRtlLang('en-US')).toBe(false);
    expect(isRtlLang('')).toBe(false);
    expect(isRtlLang(undefined)).toBe(false);
  });

  test('applyDocumentDirection sets rtl/ar for Arabic', () => {
    applyDocumentDirection('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
  });

  test('applyDocumentDirection sets ltr/en for English (region stripped)', () => {
    applyDocumentDirection('en-US');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });
});
