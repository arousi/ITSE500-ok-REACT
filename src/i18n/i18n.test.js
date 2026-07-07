import en from './locales/en.json';
import ar from './locales/ar.json';
import enApp from './locales/en/app.json';
import arApp from './locales/ar/app.json';

// Recursively collect every leaf key path (e.g. "login.errors.invalidCreds").
function keyPaths(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === 'object' && !Array.isArray(v) ? keyPaths(v, path) : [path];
  });
}

function resolve(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

// Pins the F7 invariant: English and Arabic resources never drift out of sync.
describe('i18n locale parity', () => {
  test('base en.json and ar.json have identical key paths', () => {
    expect(keyPaths(ar).sort()).toEqual(keyPaths(en).sort());
  });

  test('app namespace (en/ar app.json) has identical key paths', () => {
    expect(keyPaths(arApp).sort()).toEqual(keyPaths(enApp).sort());
  });

  test('every base key resolves to a non-empty string in both languages', () => {
    const paths = keyPaths(en);
    expect(paths.length).toBeGreaterThan(0);
    const bad = paths.filter((p) => {
      const e = resolve(en, p);
      const a = resolve(ar, p);
      return typeof e !== 'string' || e === '' || typeof a !== 'string' || a === '';
    });
    expect(bad).toEqual([]);
  });
});
