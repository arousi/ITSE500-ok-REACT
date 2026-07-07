// Minimal fallback for `web-core` utilities used by this app.
// Exports a `createApiClient` factory that implements get/post/patch/del using fetch.
import env from '../config/env';

export function createApiClient({ baseUrls = [], versionPrefix = '/api/v1', getAuthToken = async () => null, onUnauthorized = async () => {} } = {}) {
  const urls = Array.isArray(baseUrls) ? baseUrls.filter(Boolean) : [baseUrls].filter(Boolean);
  const DEFAULT_TIMEOUT_MS = env.apiRequestTimeoutMs; // per-attempt timeout
  const MAX_ATTEMPTS_PER_BASE = env.apiAttemptsPerBase;
  const FAILOVER_DELAY_MS = env.apiFailoverDelayMs;

  const buildUrl = (base, path) => `${base}${versionPrefix}${path}`;

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const request = async (method, path, data, opts = {}) => {
    const headers = Object.assign({}, opts.headers || {});
    if (data !== undefined && data !== null && !headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }
    // Attempt across bases sequentially
    const errors = [];
  for (let i = 0; i < urls.length; i++) {
      const base = urls[i];
      for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_BASE; attempt++) {
        const url = buildUrl(base, path);
  const fetchOpts = { method: method.toUpperCase(), headers: Object.assign({}, headers), credentials: (opts && opts.credentials) || 'omit' };
        if (data !== undefined && data !== null) {
          fetchOpts.body = typeof data === 'string' ? data : JSON.stringify(data);
        }
        let controller; let timeoutId;
        try {
          const timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT_MS;
          controller = new AbortController();
            fetchOpts.signal = controller.signal;
          timeoutId = setTimeout(() => {
            try { controller.abort(); } catch(_) {}
          }, timeoutMs);

          const r = await fetch(url, fetchOpts);
          clearTimeout(timeoutId);
          if (r.status === 401) {
            try { await onUnauthorized(r); } catch(_) {}
          }
          const contentType = r.headers.get('content-type') || '';
          const body = contentType.includes('application/json') ? await r.json().catch(() => null) : await r.text().catch(() => '');
          // If we reach here we have an HTTP response (even 4xx/5xx). Return immediately.
          return { data: body, status: r.status, headers: r.headers, baseUrl: base };
    } catch (err) {
          if (timeoutId) clearTimeout(timeoutId);
          // Tag network-ish errors (aborts, TypeError, connection refused)
          err.network = true;
          err.baseUrl = base;
          errors.push(err);
          // Backoff a bit before next base (or retry same base if we increase attempts)
          if (attempt === MAX_ATTEMPTS_PER_BASE - 1) {
            // move to next base after a brief grace period (configurable) to allow a possibly slow primary to recover
            await delay(FAILOVER_DELAY_MS);
            break;
          } else {
            await delay(300 * (attempt + 1));
          }
        }
      }
    }
    // Exhausted bases
    const final = errors[errors.length - 1] || new Error('No base URLs responded');
    final.attemptedBases = urls.slice();
    throw final;
  };

  return {
    get: (path, opts) => request('get', path, undefined, opts || {}),
    post: (path, body, opts) => request('post', path, body, opts || {}),
    patch: (path, body, opts) => request('patch', path, body, opts || {}),
    del: (path, opts) => request('delete', path, (opts && opts.data) !== undefined ? opts.data : undefined, opts || {}),
  };
}

export const logger = {
  info: (...args) => console.info('[webCoreFallback]', ...args),
  warn: (...args) => console.warn('[webCoreFallback]', ...args),
  error: (...args) => console.error('[webCoreFallback]', ...args),
  debug: (...args) => console.debug('[webCoreFallback]', ...args),
};
