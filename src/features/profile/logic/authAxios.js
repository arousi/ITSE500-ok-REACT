import axios from 'axios';
import env from '../../../config/env';

// Shared axios instance for authenticated calls
export const axiosAuth = axios.create();

let configured = false;
let isRefreshing = false;
let refreshPromise = null;
const subscribers = [];

function onRefreshed(token) {
  while (subscribers.length) {
    const cb = subscribers.shift();
    try { cb(token); } catch (_) {}
  }
}
function addSubscriber(cb) { subscribers.push(cb); }

function readAuthFromLocalStorage() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('auth') : null;
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}
function writeAuthToLocalStorage(auth) {
  try {
    if (typeof localStorage !== 'undefined') {
      if (auth) localStorage.setItem('auth', JSON.stringify(auth));
      else localStorage.removeItem('auth');
    }
  } catch (_) {}
}

// Ensure interceptor is set up once; accepts live getters to update auth in context when tokens refresh
const AUTH_BASE = env.authBaseUrl;
export function ensureAuthAxios({ auth, setAuth, refreshUrl = `${AUTH_BASE}/api/v1/auth_api/token/refresh/` } = {}) {
  if (configured) return; // configure once globally
  configured = true;

  axiosAuth.interceptors.request.use((config) => {
    try {
      const current = auth || readAuthFromLocalStorage();
      const token = current?.data?.access_token;
      if (token && !config.headers?.Authorization) {
        config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
      }
    } catch (_) {}
    return config;
  });

  axiosAuth.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { config, response } = error || {};
      if (!response || response.status !== 401 || config?._retry) {
        return Promise.reject(error);
      }

      // Queue requests while a refresh is in progress
      if (isRefreshing && refreshPromise) {
        return new Promise((resolve, reject) => {
          addSubscriber((newToken) => {
            if (!newToken) return reject(error);
            config._retry = true;
            config.headers = { ...(config.headers || {}), Authorization: `Bearer ${newToken}` };
            resolve(axiosAuth(config));
          });
        });
      }

      isRefreshing = true;
      config._retry = true;

      const currentAuth = auth || readAuthFromLocalStorage();
      const refreshToken = currentAuth?.data?.refresh_token;
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      // Start refresh once
      refreshPromise = axios.post(refreshUrl, { refresh: refreshToken }, { headers: { 'Content-Type': 'application/json' } });

      try {
        const resp = await refreshPromise;
        const newAccess = resp?.data?.access_token || resp?.data?.access || resp?.data?.token;
        const newRefresh = resp?.data?.refresh_token || refreshToken;
        const updated = newAccess ? {
          ...(currentAuth || {}),
          data: { ...(currentAuth?.data || {}), access_token: newAccess, refresh_token: newRefresh }
        } : currentAuth;

        if (newAccess) {
          // Update via context if provided, and persist to localStorage as a fallback
          try { setAuth && setAuth(updated); } catch (_) {}
          writeAuthToLocalStorage(updated);
        }

        onRefreshed(newAccess || null);

        // Retry the original request with new token
        config.headers = { ...(config.headers || {}), Authorization: `Bearer ${newAccess}` };
        return axiosAuth(config);
      } catch (e) {
        onRefreshed(null);
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }
  );
}
