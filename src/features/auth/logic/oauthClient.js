import logger from '../../../core/logger';
import { api } from '../../../core/apiClient';
import env from '../../../config/env';

// OAuth API base: derived from centralized env (no hardcoded production fallback).
const AUTH_ROOT = env.authBaseUrl;
const AUTH_API_EXPLICIT = env.authApiBaseUrl;
const API_BASE = (AUTH_API_EXPLICIT || (AUTH_ROOT ? `${AUTH_ROOT}/api/v1/auth_api` : ''));

// Feature flag: only attempt SSR popup flow when explicitly enabled
// Default SSR off to avoid 404 on servers without SSR endpoints
const OAUTH_SSR_ENABLED = env.oauthSsr;
// Short trial for SSR before falling back to SPA (milliseconds)
const OAUTH_SSR_TRIAL_MS = env.oauthSsrTimeoutMs;
// Allow overriding the path to the SSR authorize endpoint (use ':provider' placeholder)
const OAUTH_SSR_PATH = env.oauthSsrPath.replace(/\/$/, '/');
// Prefer using backend result endpoint instead of DOM-reading the callback page
const OAUTH_RESULT_ONLY = env.oauthResultOnly;
function providerSsrPath(provider) {
  // Map to explicit backend paths just in case
  switch (provider) {
    case 'google': return '/google/authorize/ssr/';
    case 'openrouter': return '/openrouter/authorize/ssr/';
    case 'github': return '/github/authorize/ssr/';
    case 'microsoft': return '/microsoft/authorize/ssr/';
    default: return OAUTH_SSR_PATH.replace(':provider', provider);
  }
}

// Derive allowed origin from API_BASE for secure postMessage (used by SSR popup flow)
const ALLOWED_ORIGIN = (() => {
  try { const u = new URL(API_BASE); return `${u.protocol}//${u.host}`; } catch { return env.apiBaseUrl || ''; }
})();


// Debug logging (enabled by default in development builds)
const OAUTH_DEBUG = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
function dlog(...args) {
  if (OAUTH_DEBUG) {
    try { logger.info('oauth', args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')); } catch (_) {}
  }
}

// Warn loudly if API_BASE is using the placeholder domain, which will likely 500
try {
  const u = new URL(API_BASE);
  if (/itse500-ok\.ly$/i.test(u.hostname) && OAUTH_DEBUG) {
    logger.warn('oauth', 'API_BASE is using a placeholder domain. Configure REACT_APP_AUTH_API_BASE_URL or REACT_APP_AUTH_BASE_URL', { API_BASE });
  }
} catch (_) { /* ignore invalid URL in non-browser envs */ }

// Requests go through the shared API client with base failover

function authHeaderForLinking(opts) {
  const token = opts && (opts.authToken || opts.accessToken);
  if (!token) return undefined;
  return { Authorization: `Bearer ${token}` };
}

// Providers supported by the backend (see url patterns)
const SUPPORTED_PROVIDERS = ['google', 'openrouter', 'github', 'microsoft'];
function ensureProvider(provider) {
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    throw new Error(`Provider '${provider}' not supported yet. Enabled: ${SUPPORTED_PROVIDERS.join(', ')}`);
  }
}

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
function withJitter(ms, jitter = 0) {
  if (!jitter) return ms;
  const delta = ms * jitter;
  const min = Math.max(0, ms - delta);
  const max = ms + delta;
  return Math.floor(min + Math.random() * (max - min));
}

function parseAxiosError(err) {
  if (err?.response) {
    const { status, statusText, data } = err.response;
    const detail = typeof data === 'string' ? data : (data?.detail || JSON.stringify(data));
    return new Error(`HTTP ${status} ${statusText || ''} - ${detail}`);
  }
  if (err?.request) {
    try {
      const u = new URL(API_BASE);
      return new Error(`Network/CORS error: request made but no response. Ensure ${u.protocol}//${u.host} allows CORS.`);
    } catch (_) {
      return new Error('Network/CORS error: request made but no response.');
    }
  }
  return new Error(err?.message || 'Request error');
}

// If backend mistakenly returns an authorize_url with a localhost redirect_uri,
// rewrite it to the production callback on the same API base.
function fixAuthorizeUrl(authorizeUrl, provider) {
  try {
    const url = new URL(authorizeUrl);
    // Google/GitHub/Microsoft use redirect_uri; OpenRouter uses callback_url
    const isOpenRouter = provider === 'openrouter';
    const paramName = isOpenRouter ? 'callback_url' : 'redirect_uri';
    const ru = url.searchParams.get(paramName);
    // Respect backend-provided callback exactly to ensure it matches token exchange.
    // Only set it if the backend omitted the parameter.
    if (!ru) {
      const expected = `${API_BASE}/${provider}/callback/`;
      url.searchParams.set(paramName, expected);
    }
    return url.toString();
  } catch (_) { return authorizeUrl; }
}

function openPopup(url, name = 'oauth', w = 520, h = 640) {
  const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;
  const scr = typeof window !== 'undefined' ? window.screen : undefined;
  const width = window.innerWidth || document.documentElement.clientWidth || scr?.width || 1280;
  const height = window.innerHeight || document.documentElement.clientHeight || scr?.height || 720;
  const availW = scr?.availWidth || width;
  const systemZoom = width / availW;
  const left = (width - w) / 2 / systemZoom + dualScreenLeft;
  const top = (height - h) / 2 / systemZoom + dualScreenTop;
  const popup = window.open(
    url,
    name,
    `scrollbars=yes,width=${w / systemZoom},height=${h / systemZoom},top=${top},left=${left}`
  );
  if (!popup) throw new Error('Popup was blocked by the browser');
  if (popup && popup.focus) popup.focus();
  return popup;
}

function openInTab(url) {
  const tab = window.open(url, '_blank', 'noopener');
  if (!tab) throw new Error('Tab was blocked by the browser');
  return tab;
}

// Try to read JSON payload rendered by callback endpoint in the popup (same-origin only)
function tryReadPopupCallbackJSON(popup) {
  try {
    if (!popup || popup.closed) return null;
    const loc = popup.location;
    if (!loc) return null;
    // Only when callback is loaded on the same origin
    const href = String(loc.href || '');
    // Accept both www and non-www variants of the same root domain
    const allowed = (() => {
      try {
        const u = new URL(ALLOWED_ORIGIN);
        const hostname = u.hostname.replace(/^www\./, '');
        return [
          `${u.protocol}//${u.host}`,
          `${u.protocol}//www.${hostname}`,
          `${u.protocol}//${hostname}`,
        ];
      } catch (_) { return [ALLOWED_ORIGIN]; }
    })();
    const isSameOrigin = allowed.some(o => href.startsWith(o));
    if (!isSameOrigin) return null;
    const doc = popup.document;
    if (!doc) return null;
    // Try <pre> or <code> JSON blocks first (DRF browsable API)
    const pre = doc.querySelector('pre, code');
    let text = pre ? pre.textContent : '';
    if (!text) {
      text = doc.body && doc.body.innerText ? doc.body.innerText : '';
    }
    if (!text) return null;
    // Extract the first JSON object found in the text
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const jsonSlice = text.slice(start, end + 1);
      try {
        const json = JSON.parse(jsonSlice);
        if (json && (json.user_id || json.access_token || json.refresh_token)) {
          return json;
        }
      } catch (_) { /* ignore parse errors */ }
    }
  } catch (_) { /* cross-origin or timing */ }
  return null;
}

function waitForMessageFromOrigin(origin, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        window.removeEventListener('message', onMessage);
        reject(new Error('SSR message timeout'));
      }
    }, timeoutMs);
    function onMessage(event) {
      try {
        if (event.origin !== origin) return; // ignore other origins
        const payload = event.data;
        if (payload) {
          settled = true;
          clearTimeout(timer);
          window.removeEventListener('message', onMessage);
          resolve(payload);
        }
      } catch (_) { /* ignore */ }
    }
    window.addEventListener('message', onMessage);
  });
}

async function trySSRFlow(provider, { timeoutMs = 30000 } = {}) {
  // Open SSR authorize endpoint; backend SSR callback should postMessage payload to opener
  const path = providerSsrPath(provider).replace(/^\//, '');
  const ssrUrl = `${API_BASE}/${path}?origin=${encodeURIComponent(window.location.origin)}`;
  const popup = openPopup(ssrUrl, `${provider}-oauth-ssr`);
  try {
    const result = await waitForMessageFromOrigin(ALLOWED_ORIGIN, timeoutMs);
    return result;
  } finally {
    try { if (popup && !popup.closed) popup.close(); } catch (_) {}
  }
}

// SSR utilities omitted (SSR disabled).

// SSR flow intentionally disabled for now to avoid hitting missing backend routes.

async function fetchAuthorize(provider, opts) {
  // SPA bridge: GET /<provider>/authorize/ -> { authorize_url, state }
  try {
  const endpoint = `/auth_api/${provider}/authorize/`;
    // Hint backend about the public base and client origin to avoid localhost callbacks
    const expectedCallback = `${API_BASE}/${provider}/callback/`;
    const params = {
      origin: typeof window !== 'undefined' ? window.location.origin : undefined,
      public_base: ALLOWED_ORIGIN,
      redirect_uri: expectedCallback,
      // For OpenRouter, some backends prefer callback_url; include both for safety
      ...(provider === 'openrouter' ? { callback_url: expectedCallback } : {}),
    };
  const headers = opts?.link ? authHeaderForLinking(opts) : undefined;
  dlog('authorize:request', { url: `${ALLOWED_ORIGIN}${endpoint}`, provider, params, link: !!opts?.link, hasAuth: !!headers });
  const { data } = await api.get(endpoint, { params, headers });
  const state = data?.state || data?.state_value || data?.state_id;
  if (!data || !data.authorize_url || !state) throw new Error('Invalid authorize response');
  const authorizeUrl = fixAuthorizeUrl(data.authorize_url, provider);
    dlog('authorize:ok', { provider, state, authorizeUrl });
  return { authorizeUrl, state };
  } catch (err) {
    // Diagnostic: log api shape if available to help debug adapter issues
    try {
      const a = api || {};
      const keys = Object.keys(a).slice(0, 8);
      logger.warn('oauth', 'authorize error; api shape', { hasApi: !!api, keys });
    } catch (_) {}
    const e = parseAxiosError(err);
    e.message = `[${provider}] authorize failed: ${e.message}`;
    dlog('authorize:fail', { provider, error: e.message });
    throw e;
  }
}

async function fetchResult(_provider, state) {
  // Canonical SPA/mobile bridge endpoint implemented by backend
  const path = `/auth_api/oauth/result/${encodeURIComponent(state)}/`;
  try {
  dlog('result:request', { url: `${ALLOWED_ORIGIN}${path}`, state });
  const { data } = await api.get(path);
    if (!data) throw new Error('OAuth result not available');
    dlog('result:ok', { state, keys: Object.keys(data || {}) });
    return data;
  } catch (err) {
    const status = err?.response?.status;
    // 404: invalid or not created yet -> keep polling
    if (status === 404) { dlog('result:pending', { state, status }); return null; }
    // 409: may be pending OR a conflict; inspect payload
    if (status === 409) {
      const code = err?.response?.data?.error_code || err?.response?.data?.code || '';
      const msg = err?.response?.data?.detail || err?.message || 'Conflict';
      if (typeof code === 'string' && /conflict|already|in[_-]?use/i.test(code)) {
        dlog('result:conflict', { state, status, code, message: msg });
        const ex = new Error(msg);
        ex.name = 'OAuthConflictError';
        ex.code = code;
        throw ex;
      }
      dlog('result:pending', { state, status });
      return null;
    }
    // One-time already consumed
    if (status === 410) { dlog('result:gone', { state, status }); throw new Error('OAuth result already retrieved. Please restart sign-in.'); }
    // Surface server errors and others with details
    dlog('result:error', { state, status, message: err?.message });
    throw parseAxiosError(err);
  }
}

export async function startOAuth(provider, { timeoutMs = 180000, pollMs = 1200, maxPollMs = 10000, backoffFactor = 1.6, jitter = 0.2, maxPollAttempts = 40, window: windowMode = 'popup', link = false, authToken = undefined, accessToken = undefined } = {}) {
  ensureProvider(provider);
  // Try SSR first (popup + postMessage) only if enabled; keep the trial short to avoid lingering 404 popups
  if (OAUTH_SSR_ENABLED) {
    try {
      // In SSR mode, the backend SSR page posts a message to opener with the final payload.
      const ssrMsg = await trySSRFlow(provider, { timeoutMs: Math.min(OAUTH_SSR_TRIAL_MS, timeoutMs) });
      const payload = ssrMsg?.data || ssrMsg;
      // If payload already contains tokens/user info, use it directly
      if (payload && (payload.access_token || payload.refresh_token || payload.user_id || payload.provider_access_token)) {
        return payload;
      }
      // Otherwise, if it only contains state, try result endpoint
      const announcedState = payload?.state || payload?.state_value || payload?.state_id || ssrMsg?.state || ssrMsg?.state_value || ssrMsg?.state_id;
      if (announcedState) {
        try { return await fetchResult(provider, announcedState); } catch (_) { /* fall through */ }
      }
      // If no usable data, fall back to SPA flow
    } catch (_) { /* ignore and fallback to SPA */ }
  }
  // SPA-only flow (SSR disabled)
  dlog('flow:start', { provider, base: API_BASE });
  if (link && !authToken) dlog('link:warn', { note: 'link requested without authToken; server may not associate state with user' });
  const { authorizeUrl, state } = await fetchAuthorize(provider, { link, authToken });
  dlog('popup:open', { authorizeUrl });
  const win = windowMode === 'tab' ? openInTab(authorizeUrl) : openPopup(authorizeUrl, `${provider}-oauth`);
  const start = Date.now();
  let delay = Math.max(200, pollMs);
  let result = null;
  let attempt = 0;
    try {
    while (Date.now() - start < timeoutMs) {
      attempt += 1;
      // If we've polled too many times without a result, fail early to inform the user
      if (maxPollAttempts && attempt >= maxPollAttempts) {
        dlog('flow:abort', { provider, attempt, maxPollAttempts });
        throw new Error('OAuth result not available — please try again or contact support.');
      }
      // First, try server-side result endpoint if available
      try { result = await fetchResult(provider, state); if (result) { dlog('flow:success', { provider, attempt }); break; } } catch (_) {}
      // Optional fallback: attempt to read JSON payload directly from popup page (disabled by default)
      if (!OAUTH_RESULT_ONLY) {
        try { result = tryReadPopupCallbackJSON(win); if (result) break; } catch(_) {}
      }
      // Avoid reading win.closed; COOP/COEP can sever the opener/openee relationship and
      // Chrome may warn: "Cross-Origin-Opener-Policy policy would block the window.closed call."
      // We'll rely on timeout/result instead and close the window in finally.
      await sleep(withJitter(delay, jitter));
      delay = Math.min(maxPollMs, Math.ceil(delay * (backoffFactor > 1 ? backoffFactor : 1)));
    }
  } finally {
    // Best-effort close without checking win.closed to avoid COOP warnings
    try { if (win && windowMode !== 'tab') win.close(); } catch(_) {}
  }
  if (!result) { dlog('flow:timeout', { provider, state, elapsedMs: Date.now() - start }); throw new Error('OAuth timeout or no result'); }
  return result;
}

export function normalizeAuthPayload(raw) {
  // Preserve the REST payload as-is, but ensure common aliases exist for app code
  const base = (raw && typeof raw === 'object') ? raw : {};
  const payload = (base && typeof base.data === 'object' && Object.keys(base).length === 1)
    ? base.data
    : (base.data && typeof base.data === 'object' ? { ...base.data, ...base } : base);

  const normalized = { ...(payload || {}) };
  // Add aliases without overwriting original keys
  if (!normalized.user_id) {
    normalized.user_id = payload?.user_id || payload?.id || payload?.pk || payload?.user?.id || payload?.profile?.user_id || normalized?.id || normalized?.pk;
  }
  // Access/refresh can be at root, or nested under `tokens` or `data.tokens`
  const tokens = payload?.tokens || base?.tokens || payload?.data?.tokens || base?.data?.tokens || {};
  if (!normalized.access_token) normalized.access_token = payload?.access || payload?.token || tokens?.access;
  if (!normalized.refresh_token) normalized.refresh_token = payload?.refresh || tokens?.refresh;

  return { data: normalized };
}
