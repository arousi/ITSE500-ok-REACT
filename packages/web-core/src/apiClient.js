// Minimal SSR-safe API client for web-core
// Handle both CJS and ESM builds of axios in bundlers (axios may be under `.default`).
// Also handle environments where axios is a callable function (axios(config)) versus an instance with axios.request(config).
const _axiosModule = (() => {
  try { return require('axios'); } catch (e) { return null; }
})();
const axios = _axiosModule && _axiosModule.default ? _axiosModule.default : _axiosModule;
let axiosRequest = (typeof axios === 'function')
  ? axios // axios(config)
  : (axios && typeof axios.request === 'function')
    ? axios.request.bind(axios) // axios.request(config)
    : null;
const logger = require('./logger');
function createApiClient({ baseUrls, versionPrefix = '/api/v1', failoverStatuses = [404, 502, 503], getAuthToken, onUnauthorized }) {
  function normalizeEndpoint(endpoint) {
    if (!endpoint) return '';
    if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;
    if (versionPrefix) {
      const vp = versionPrefix.endsWith('/') ? versionPrefix.slice(0, -1) : versionPrefix;
      if (endpoint.startsWith(vp + '/')) return endpoint; // already prefixed
      return vp + endpoint;
    }
    return endpoint;
  }
  function candidateUrls(endpoint) {
    return baseUrls.map(base => base.replace(/\/$/, '') + normalizeEndpoint(endpoint));
  }
  async function tryRequest(method, endpoint, { headers = {}, data, params } = {}) {
    if (!axiosRequest) {
      // axios isn't available in this environment or import shape is unexpected.
      // Install a minimal fetch-based adapter that mimics axios's request signature
      // so the rest of the code can continue to work (useful for lightweight
      // environments, tests, or when bundler interop fails).
      const diag = axios ? Object.keys(axios).slice(0, 8) : [];
      logger.warn('api', 'axios adapter missing; installing fetch-based adapter', { type: typeof axios, keys: diag });

      axiosRequest = async function fetchAdapter(config) {
        if (!config || !config.url) throw new Error('fetchAdapter requires a config with url');
        const method = (config.method || 'get').toUpperCase();
        // Build URL and append params if provided
        const urlObj = new URL(config.url);
        if (config.params && typeof config.params === 'object') {
          Object.entries(config.params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) urlObj.searchParams.set(k, String(v));
          });
        }
        const headers = Object.assign({}, config.headers || {});
        const fetchOpts = { method, headers };
        if (config.data !== undefined && config.data !== null) {
          if (!fetchOpts.headers['Content-Type'] && !fetchOpts.headers['content-type']) {
            fetchOpts.headers['Content-Type'] = 'application/json';
          }
          fetchOpts.body = typeof config.data === 'string' ? config.data : JSON.stringify(config.data);
        }
        let r;
        try {
          r = await fetch(urlObj.toString(), fetchOpts);
        } catch (e) {
          // network-level error
          const err = new Error('Network error in fetchAdapter');
          err.original = e;
          throw err;
        }
        const contentType = r.headers.get('content-type') || '';
        const responseData = contentType.includes('application/json') ? await r.json() : await r.text();
        // Build an axios-like response object
        return {
          data: responseData,
          status: r.status,
          statusText: r.statusText || '',
          headers: r.headers,
          config,
        };
      };
    }
    const urls = candidateUrls(endpoint);
    let lastError = null;
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const started = Date.now();
      try {
        const h = { ...headers };
        if (getAuthToken) {
          const token = await getAuthToken();
          if (token && !h.Authorization) h.Authorization = `Bearer ${token}`;
        }
        const resp = await axiosRequest({ url, method, headers: h, data, params, withCredentials: false });
        if (!failoverStatuses.includes(resp.status)) {
          logger.info('api', `${method.toUpperCase()} accepted`, { url, status: resp.status, statusText: resp.statusText, elapsedMs: Date.now() - started });
          return resp;
        }
        logger.warn('api', `${method.toUpperCase()} returned ${resp.status}`, null, { url, attempt: i + 1, elapsedMs: Date.now() - started });
        continue;
      } catch (e) {
        const status = e?.response?.status;
        if (status && !failoverStatuses.includes(status)) {
          logger.warn('api', `${method.toUpperCase()} fatal status ${status}`, e, { url, attempt: i + 1, elapsedMs: Date.now() - started });
          if (onUnauthorized && status === 401) await onUnauthorized(e);
          throw e;
        }
        lastError = e;
        logger.warn('api', `${method.toUpperCase()} failed`, e, { url, attempt: i + 1, elapsedMs: Date.now() - started });
      }
    }
    if (lastError) logger.error('api', `All endpoints failed for ${method.toUpperCase()} ${endpoint}`, lastError);
    throw lastError || new Error('All endpoints failed');
  }
  return {
    get: (endpoint, opts) => tryRequest('get', endpoint, opts),
    post: (endpoint, data, opts) => tryRequest('post', endpoint, { ...opts, data }),
    put: (endpoint, data, opts) => tryRequest('put', endpoint, { ...opts, data }),
    del: (endpoint, opts) => tryRequest('delete', endpoint, opts),
  };
}
module.exports = { createApiClient };
