// Centralized access-token refresh for the core API client, so ANY authenticated
// call can transparently refresh on a 401 — not just the profile flow that had
// its own axios interceptor. Concurrent 401s share a single in-flight refresh.
// On success it updates the persisted auth in localStorage and fires the existing
// `auth:changed` event that UserProvider already listens for (in-app + cross-tab).
import env from '../config/env';
import logger from './logger';

let inFlight = null; // dedupe concurrent refreshes

function readAuth() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('auth') : null;
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function persist(auth) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem('auth', JSON.stringify(auth));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('auth:changed'));
    }
  } catch (_) { /* ignore */ }
}

// Returns a fresh access token (string), or null when refresh isn't possible
// (no refresh token, or the refresh call failed). Never throws.
export async function refreshAccessToken() {
  const auth = readAuth();
  const refresh = auth?.data?.refresh_token;
  if (!refresh) return null;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const url = `${env.authBaseUrl}/api/v1/auth_api/token/refresh/`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!r.ok) return null;
      const data = await r.json().catch(() => null);
      const newAccess = data?.access || data?.access_token;
      if (!newAccess) return null;
      const updated = {
        ...auth,
        data: {
          ...auth.data,
          access_token: newAccess,
          refresh_token: data?.refresh || data?.refresh_token || refresh,
        },
      };
      persist(updated);
      return newAccess;
    } catch (e) {
      logger.warn('auth', 'token refresh failed', e?.message || e);
      return null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export default refreshAccessToken;
