import { authApi, unifiedSync, oauthApi } from './apiClient';
import logger from './logger';

// Auth flows
export async function login(user) {
  try { const r = await authApi.login(user); return r?.data; } catch (e) { logger.error('login', 'login failed', e); throw e; }
}
export async function logout(token) {
  try { const r = await authApi.logout(token); return r?.data; } catch (e) { logger.error('login', 'logout failed', e); throw e; }
}
export async function refresh(refreshToken) {
  try { const r = await authApi.refresh(refreshToken); return r?.data; } catch (e) { logger.error('auth', 'refresh failed', e); throw e; }
}

// Profile via unified sync
export async function getProfile(params, token) {
  try { const r = await unifiedSync.getMe({ ...params, profile: true, chat: false }, token); return r?.data; } catch (e) { logger.error('profile', 'get failed', e); throw e; }
}
export async function updateProfile(body, token) {
  try { const r = await unifiedSync.postMe(body, token); return r?.data; } catch (e) { logger.error('profile', 'update failed', e); throw e; }
}
export async function archiveProfile(body, token) {
  try { const r = await unifiedSync.deleteMe(body, token); return r?.data; } catch (e) { logger.error('profile', 'archive failed', e); throw e; }
}
export async function deleteProfile(body, token) {
  try { const r = await unifiedSync.deleteMe(body, token); return r?.data; } catch (e) { logger.error('profile', 'delete failed', e); throw e; }
}

// OAuth helpers
export async function oauthAuthorize(provider) { return oauthApi.authorize(provider); }
export async function oauthResult(state) { return oauthApi.result(state); }

const server = { login, logout, refresh, getProfile, updateProfile, archiveProfile, deleteProfile, oauthAuthorize, oauthResult };
export default server;
