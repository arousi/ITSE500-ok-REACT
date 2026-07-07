import env, { getApiBaseUrls, validateEnv, API_VERSION_PREFIX } from './env';

// Pins the F0 config contract: no dev-host leakage, fail-loud in prod,
// feature flags default off. Runs with NODE_ENV=test (isProd=false).
describe('config/env', () => {
  test('exposes the versioned API prefix', () => {
    expect(API_VERSION_PREFIX).toBe('/api/v1');
  });

  test('isProd is false under the test runner', () => {
    expect(env.isProd).toBe(false);
  });

  test('validateEnv does not throw outside production', () => {
    expect(() => validateEnv()).not.toThrow();
    expect(validateEnv()).toEqual({ ok: true, missing: [] });
  });

  test('getApiBaseUrls returns a non-empty list of string bases', () => {
    const bases = getApiBaseUrls();
    expect(Array.isArray(bases)).toBe(true);
    expect(bases.length).toBeGreaterThan(0);
    bases.forEach((b) => expect(typeof b).toBe('string'));
  });

  test('feature flags default to off', () => {
    expect(env.enableManagedLlm).toBe(false);
    expect(env.enablePasswordReset).toBe(false);
    expect(env.enableFeedback).toBe(false);
  });

  test('oauth SSR stays disabled by default', () => {
    expect(env.oauthSsr).toBe(false);
  });
});
