// Minimal OAuth reducer for register flow
// Handles OAuth success for Google, Microsoft, and OpenRouter and a few common cases.

/**
 * @typedef {Object} RegisterAuthState
 * @property {any|null} auth - Normalized auth payload or null when signed out
 * @property {('google'|'microsoft'|'openrouter'|null)} provider - The last provider used
 * @property {string|null} error - Error message if any
 */

/** @type {RegisterAuthState} */
const initialState = { auth: null, provider: null, error: null };

/**
 * @param {RegisterAuthState} state
 * @param {{ type: string, payload?: any }} action
 * @returns {RegisterAuthState}
 */
export default function registerOAuthReducer(state = initialState, action) {
  switch (action.type) {
    case 'GOOGLE_OAUTH':
    case 'MICROSOFT_OAUTH':
    case 'OPENROUTER_OAUTH': {
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
