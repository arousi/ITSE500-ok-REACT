// Centralized runtime configuration — the SINGLE source of truth for every
// REACT_APP_* value the app reads. Nothing else should read process.env directly.
//
// Why this exists: base URLs used to be read ad-hoc across ~10 files, each with a
// hardcoded fallback to a developer host (http://localhost:8000 / http://192.168.1.50:8000)
// or a placeholder domain. In a production build those baked in and caused
// mixed-content errors and silent failover to nonexistent hosts. Here, production
// defaults are intentionally EMPTY and `validateEnv()` fails loudly if a required
// var is missing, so misconfiguration surfaces at startup instead of at runtime.

const isProd = process.env.NODE_ENV === 'production';
const isBrowser = typeof window !== 'undefined';

// Optional runtime override hook. Not used today (env is baked at build time), but
// lets a container entrypoint later inject `window._env_ = {...}` to run one image
// across environments without rebuilding — env.js just needs to prefer it.
function readRaw(key) {
  if (isBrowser && window._env_ && Object.prototype.hasOwnProperty.call(window._env_, key)) {
    return window._env_[key];
  }
  return process.env[key];
}

const stripTrailingSlash = (u) => (typeof u === 'string' ? u.replace(/\/$/, '') : u);

// Dev-only defaults. Gated behind `isProd` so the minifier drops these string
// literals entirely from the production bundle (dead branch of a constant ternary).
const DEV = isProd ? {} : {
  REACT_APP_API_BASE_URL: 'http://127.0.0.1:8000',
  REACT_APP_SECONDARY_API_BASE_URL: 'http://127.0.0.1:8000',
  REACT_APP_AUTH_BASE_URL: 'http://127.0.0.1:8000',
};

function url(key) {
  const raw = readRaw(key);
  const v = raw && String(raw).trim() ? String(raw).trim() : (DEV[key] || '');
  return stripTrailingSlash(v) || '';
}
function str(key, def = '') {
  const v = readRaw(key);
  return v === undefined || v === null || v === '' ? def : String(v);
}
function bool(key, def = false) {
  const v = readRaw(key);
  if (v === undefined || v === null || v === '') return def;
  return String(v).toLowerCase() === 'true';
}
function num(key, def) {
  const v = Number(readRaw(key));
  return Number.isFinite(v) ? v : def;
}

export const API_VERSION_PREFIX = '/api/v1';

const env = {
  isProd,

  // --- API base URLs (dev fallbacks only apply when NODE_ENV !== 'production') ---
  apiBaseUrl: url('REACT_APP_API_BASE_URL'),
  secondaryApiBaseUrl: url('REACT_APP_SECONDARY_API_BASE_URL'),
  tertiaryApiBaseUrl: url('REACT_APP_TERTIARY_API_BASE_URL'),
  authBaseUrl: url('REACT_APP_AUTH_BASE_URL'),
  authApiBaseUrl: url('REACT_APP_AUTH_API_BASE_URL'),
  localBackendFirst: bool('REACT_APP_LOCAL_BACKEND_FIRST', false),

  // --- HTTP client tuning ---
  apiRequestTimeoutMs: num('REACT_APP_API_REQUEST_TIMEOUT_MS', 15000),
  apiAttemptsPerBase: num('REACT_APP_API_ATTEMPTS_PER_BASE', 1),
  apiFailoverDelayMs: num('REACT_APP_API_FAILOVER_DELAY_MS', 200),

  // --- OAuth ---
  oauthSsr: bool('REACT_APP_OAUTH_SSR', false),
  oauthResultOnly: bool('REACT_APP_OAUTH_RESULT_ONLY', false),
  oauthSsrTimeoutMs: num('REACT_APP_OAUTH_SSR_TIMEOUT_MS', 12000),
  oauthSsrPath: str('REACT_APP_OAUTH_SSR_PATH', '/:provider/authorize/ssr/'),

  // --- Feature flags ---
  enableManagedLlm: bool('REACT_APP_ENABLE_MANAGED_LLM', false),

  // --- BYO provider key fallbacks (optional; empty is fine — users bring their own) ---
  geminiKey: str('REACT_APP_GEMINI_SECRET_KEY', ''),
  openRouterKey: str('REACT_APP_OPENROUTER_SECRET_KEY', ''),
  openAiKey: str('REACT_APP_OPENAI_SECRET_KEY', ''),
  huggingFaceKey: str('REACT_APP_HUGGINGFACE_SECRET_KEY', ''),

  // --- Observability (optional) ---
  sentryDsn: str('REACT_APP_SENTRY_DSN', ''),
};

// Derived: the ordered list of API bases the failover client should try.
export function getApiBaseUrls() {
  const bases = [env.apiBaseUrl, env.secondaryApiBaseUrl, env.tertiaryApiBaseUrl].filter(Boolean);
  // Optional local-first ordering on localhost when explicitly requested.
  try {
    if (isBrowser && env.localBackendFirst) {
      const host = (window.location && window.location.hostname) || '';
      if (host === 'localhost' || host === '127.0.0.1') {
        return [env.secondaryApiBaseUrl, env.tertiaryApiBaseUrl, env.apiBaseUrl].filter(Boolean);
      }
    }
  } catch (_) { /* ignore */ }
  return bases;
}

// Required for the app to function in production. Missing => fail loudly at startup.
const REQUIRED_IN_PROD = ['apiBaseUrl', 'authBaseUrl'];

export function validateEnv() {
  if (!isProd) return { ok: true, missing: [] };
  const missing = REQUIRED_IN_PROD.filter((k) => !env[k]);
  if (missing.length) {
    const varNames = missing
      .map((k) => (k === 'apiBaseUrl' ? 'REACT_APP_API_BASE_URL' : 'REACT_APP_AUTH_BASE_URL'))
      .join(', ');
    const msg = `[config] Missing required production env var(s): ${varNames}. `
      + 'Set them at build time in .env.production before running `npm run build`.';
    console.error(msg);
    throw new Error(msg);
  }
  return { ok: true, missing: [] };
}

export default env;
