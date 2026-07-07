// Minimal OAuth reducer for login flow
// Supports Google, Microsoft, OpenRouter, and GitHub OAuth results.

/**
 * @typedef {Object} LoginAuthState
 * @property {any|null} auth - Normalized auth payload or null when signed out
 * @property {('google'|'microsoft'|'openrouter'|'github'|null)} provider - The last provider used
 * @property {string|null} error - Error message if any
 */

/** @type {LoginAuthState} */
const initialState = { auth: null, provider: null, error: null };

/**
 * @param {LoginAuthState} state
 * @param {{ type: string, payload?: any }} action
 * @returns {LoginAuthState}
 */
export default function loginOAuthReducer(state = initialState, action) {
  switch (action.type) {
    case 'GOOGLE_OAUTH':
    case 'MICROSOFT_OAUTH':
    case 'OPENROUTER_OAUTH':
    case 'GITHUB_OAUTH': {
      const provider = action.type.replace('_OAUTH', '').toLowerCase();
      return { ...state, auth: action.payload ?? null, provider, error: null };
    }

    case 'OAUTH_ERROR':
      return { ...state, error: typeof action.payload === 'string' ? action.payload : 'OAuth error' };

    case 'LOGOUT':
      return { ...state, auth: null, provider: null, error: null };

    default:
      return state;
  }
}
