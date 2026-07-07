// Thin adapter — prefer a locally-provided shim instead of depending on external
// `web-core` package which isn't present in this build environment.
import { createApiClient } from './webCoreFallback';
import logger from './logger';
import { getApiBaseUrls, API_VERSION_PREFIX } from '../config/env';
import { refreshAccessToken } from './tokenRefresh';

// Ordered API bases (primary → failover, with optional local-first) come from
// centralized config. In production there are no localhost fallbacks.
let baseUrls = getApiBaseUrls();

const versionPrefix = API_VERSION_PREFIX;

// Try to use web-core's createApiClient, but provide a robust axios fallback
let api = null;
try {
  if (typeof createApiClient === 'function') {
    api = createApiClient({
      baseUrls,
      versionPrefix,
      getAuthToken: async () => null,
      onUnauthorized: async (e) => { logger.warn('auth', 'unauthorized', e); },
    });
  }
} catch (err) {
  logger.warn('apiClient', 'web-core createApiClient failed, falling back to axios', err);
}

// If createApiClient returned an api but it doesn't implement PATCH, shim it so
// callers can always use api.patch(). Prefer emulation via api.post with
// X-HTTP-Method-Override when possible to work with middlewares; otherwise
// perform a direct fetch PATCH as a last resort.
if (api && typeof api.patch !== 'function') {
  // Provide a patch implementation that uses a true PATCH request via fetch
  // to avoid sending X-HTTP-Method-Override which can be blocked by CORS.
  api.patch = (path, body, opts = {}) => {
    const base = (baseUrls && baseUrls[0]) || '';
    const url = `${base}${versionPrefix}${path}`;
    const fetchOpts = { method: 'PATCH', headers: Object.assign({}, (opts && opts.headers) || {}) };
    if (body !== undefined && body !== null) {
      if (!fetchOpts.headers['Content-Type'] && !fetchOpts.headers['content-type']) {
        fetchOpts.headers['Content-Type'] = 'application/json';
      }
      fetchOpts.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    return fetch(url, fetchOpts).then(async (r) => {
      const contentType = r.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await r.json() : await r.text();
      return { data, status: r.status, headers: r.headers };
    });
  };
}

// Fallback simple api using axios when web-core is not present or misconfigured
if (!api || typeof api.get !== 'function') {
  const tryRequest = async (method, path, data, opts = {}) => {
    const errors = [];
    for (const base of baseUrls) {
      const baseUrl = base.replace(/\/$/, '');
      try {
        const url = new URL(`${baseUrl}${versionPrefix}${path}`);
        if (opts && opts.params) {
          Object.entries(opts.params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) url.searchParams.set(k, v);
          });
        }
        const headers = Object.assign({}, (opts.headers || {}));
        const fetchOpts = { method: method.toUpperCase(), headers };
        if (data !== undefined && data !== null) {
          if (!fetchOpts.headers['Content-Type'] && !fetchOpts.headers['content-type']) {
            fetchOpts.headers['Content-Type'] = 'application/json';
          }
          fetchOpts.body = typeof data === 'string' ? data : JSON.stringify(data);
        }
        const r = await fetch(url.toString(), fetchOpts);
        const contentType = r.headers.get('content-type') || '';
        let body = null;
        if (contentType.includes('application/json')) body = await r.json();
        else body = await r.text();
        return { data: body, status: r.status, headers: r.headers };
      } catch (e) {
        errors.push(e);
      }
    }
    const last = errors[errors.length - 1];
    throw last || new Error('No base urls available');
  };

  api = {
    get: (path, opts) => tryRequest('get', path, undefined, opts || {}),
    post: (path, body, opts) => tryRequest('post', path, body, opts || {}),
  patch: (path, body, opts) => tryRequest('patch', path, body, opts || {}),
  // Support bodies in DELETE by passing opts.data when provided
  del: (path, opts) => tryRequest('delete', path, (opts && opts.data) !== undefined ? opts.data : undefined, opts || {}),
  };
}

// Backwards-compatible wrappers used in the app
export const authApi = {
  login: (body) => api.post('/auth_api/login/', body),
  logout: (token) => api.post('/auth_api/logout/', undefined, { headers: { Authorization: `Bearer ${token}` } }),
  refresh: (refresh) => api.post('/auth_api/token/refresh/', { refresh }),
};

// Diagnostic: if api is unexpectedly missing methods, warn at module initialization
try {
  if (!api || typeof api.get !== 'function' || typeof api.post !== 'function') {
    logger.warn('apiClient', 'api adapter missing expected methods', { hasApi: !!api, keys: api ? Object.keys(api).slice(0, 8) : [] });
  }
} catch (_) {}

// Run an authenticated call; on a 401 response, refresh the access token once
// and retry with the fresh token. Covers reads/writes that RETURN (not throw)
// on 401 — getMe/postMe use the fetch-based client. (patchMe/deleteMe throw on
// non-2xx and are refresh-handled by their callers.)
async function callWithRefresh(makeCall, token) {
  let resp = await makeCall(token);
  if (resp && resp.status === 401) {
    const fresh = await refreshAccessToken();
    if (fresh) resp = await makeCall(fresh);
  }
  return resp;
}

export const unifiedSync = {
  getMe: (params, token) => callWithRefresh((tk) => api.get('/user_mang/me/', { params, headers: tk ? { Authorization: `Bearer ${tk}` } : {}, credentials: 'include' }), token),
  postMe: (body, token) => callWithRefresh((tk) => api.post('/user_mang/me/', body, { headers: tk ? { Authorization: `Bearer ${tk}` } : {} }), token),
  // Use direct fetch for DELETE to guarantee body + Authorization header are sent
  patchMe: async (body, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    // If we have a token, prefer to perform a direct PATCH fetch so we can guarantee
    // the Authorization header is sent (some api implementations may ignore opts.headers).
    if (token) {
      const base = (baseUrls && baseUrls[0]) || '';
      const url = `${base}${versionPrefix}/user_mang/me/`;
      const fetchOpts = { method: 'PATCH', headers: Object.assign({}, headers) };
      if (body !== undefined && body !== null) {
        if (!fetchOpts.headers['Content-Type'] && !fetchOpts.headers['content-type']) {
          fetchOpts.headers['Content-Type'] = 'application/json';
        }
        fetchOpts.body = typeof body === 'string' ? body : JSON.stringify(body);
      }
      const r = await fetch(url, fetchOpts);
      const contentType = r.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await r.json() : await r.text();
      const resp = { data, status: r.status, headers: r.headers };
      if (Math.floor(resp.status / 100) !== 2) {
        const err = new Error('Non-2xx response');
        err.response = { status: resp.status, data: resp.data };
        throw err;
      }
      return resp;
    }
    // No token: fall back to api.patch if available, otherwise direct fetch
    if (api && typeof api.patch === 'function') {
      const resp = await api.patch('/user_mang/me/', body, { headers });
      if (resp && typeof resp.status === 'number' && Math.floor(resp.status / 100) !== 2) {
        const err = new Error('Non-2xx response');
        err.response = { status: resp.status, data: resp.data };
        throw err;
      }
      return resp;
    }
    const base = (baseUrls && baseUrls[0]) || '';
    const url = `${base}${versionPrefix}/user_mang/me/`;
    const fetchOpts = { method: 'PATCH', headers: Object.assign({}, headers) };
    if (body !== undefined && body !== null) {
      if (!fetchOpts.headers['Content-Type'] && !fetchOpts.headers['content-type']) {
        fetchOpts.headers['Content-Type'] = 'application/json';
      }
      fetchOpts.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    const r = await fetch(url, fetchOpts);
    const contentType = r.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await r.json() : await r.text();
    const resp = { data, status: r.status, headers: r.headers };
    if (Math.floor(resp.status / 100) !== 2) {
      const err = new Error('Non-2xx response');
      err.response = { status: resp.status, data: resp.data };
      throw err;
    }
    return resp;
  },
  deleteMe: async (body, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    // If we have a token, perform a direct DELETE fetch so we can include a JSON body reliably
    if (token) {
      const base = (baseUrls && baseUrls[0]) || '';
      const url = `${base}${versionPrefix}/user_mang/me/`;
      const fetchOpts = { method: 'DELETE', headers: Object.assign({}, headers) };
      if (body !== undefined && body !== null) {
        if (!fetchOpts.headers['Content-Type'] && !fetchOpts.headers['content-type']) {
          fetchOpts.headers['Content-Type'] = 'application/json';
        }
        fetchOpts.body = typeof body === 'string' ? body : JSON.stringify(body);
      }
      const r = await fetch(url, fetchOpts);
      const contentType = r.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await r.json() : await r.text();
      const resp = { data, status: r.status, headers: r.headers };
      if (Math.floor(resp.status / 100) !== 2) {
        const err = new Error('Non-2xx response');
        err.response = { status: resp.status, data: resp.data };
        throw err;
      }
      return resp;
    }
    // Fallback to api.del which now supports opts.data in the fallback adapter
    const resp = await api.del('/user_mang/me/', { data: body, headers });
    if (resp && typeof resp.status === 'number' && Math.floor(resp.status / 100) !== 2) {
      const err = new Error('Non-2xx response');
      err.response = { status: resp.status, data: resp.data };
      throw err;
    }
    return resp;
  },
};

export const oauthApi = {
  authorize: (provider) => api.get(`/auth_api/${provider}/authorize/`),
  result: (state) => api.get(`/auth_api/oauth/result/${encodeURIComponent(state)}/`),
};

export { api };
