import { authApi } from "../../../core/apiClient";
import logger from "../../../core/logger";

// loginReducer is used as an async helper to perform the LOGIN network call.
// It returns a plain object describing success or failure so callers (UI) can react.
export default async function loginReducer(_currentState, action) {
    // Only handle explicit actions used by the UI
    switch (action.type) {
        case "LOGIN": {
            const newUser = action.payload?.newUser || {};
            // Accept multiple possible password field names (password or user_password)
            const password = newUser.password || newUser.user_password || '';
            if (!newUser.username || !password) {
                const err = new Error('Missing username or password');
                logger.error('login', 'Missing credentials', { username: !!newUser.username });
                return { success: false, error: err };
            }
            try {
                const resp = await authApi.login(newUser);
                logger.info('login', 'Login success', { status: resp?.status });
                return { success: true, data: resp };
            } catch (e) {
                logger.error('login', 'Login failed', e);
                return { success: false, error: e };
            }
        }

        case "OAUTH_LOGIN": {
            return { success: false, error: new Error('OAUTH_LOGIN not implemented in reducer') };
        }

        default:
            return { success: false, error: new Error('Unknown action') };
    }
}