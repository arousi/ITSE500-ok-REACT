// Managed ("Ozma Kapa") LLM path — the paid/metered tier.
//
// Unlike the BYO-key providers (which call the model vendor directly from the
// browser with the user's own key), the managed path routes chat through the
// backend chat_api. The backend holds the business provider key, runs the model,
// and meters token usage for billing — so keys never touch the browser and
// metering can't be tampered with client-side.
//
// This is DARK until two things exist: REACT_APP_ENABLE_MANAGED_LLM=true AND a
// built backend chat_api (itse500-django Phase 4). Everything below no-ops or
// errors cleanly while the flag is off, so it ships safely today.
import axios from 'axios';
import env, { API_VERSION_PREFIX } from '../../../config/env';

export const MANAGED_PROVIDER_NAME = 'Ozma Kapa';

function readAccessToken() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('auth') : null;
    const auth = raw ? JSON.parse(raw) : null;
    return auth?.data?.access_token || null;
  } catch (_) {
    return null;
  }
}

// Managed model catalogue served by the backend (business-provided models).
// Returns [] while the flag is off or the backend isn't reachable yet.
export async function getManagedModelsData() {
  if (!env.enableManagedLlm) return [];
  try {
    const token = readAccessToken();
    const r = await axios.get(`${env.apiBaseUrl}${API_VERSION_PREFIX}/chat_api/models/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const models = r?.data?.models || r?.data?.data || r?.data || [];
    if (!Array.isArray(models)) return [];
    return models.map((m) => ({
      name: m.id || m.name,
      provider: MANAGED_PROVIDER_NAME,
      categories: Array.isArray(m.categories) && m.categories.length ? m.categories : ['Chat'],
    }));
  } catch (_) {
    return [];
  }
}

// Send a chat completion through the managed backend. Uses the user's SESSION
// token (not a provider key). Returns the app's standard { text, raw, image? }.
export async function getManagedAIResponse(modelSelected, messages, settings, signal) {
  const token = readAccessToken();
  const body = {
    model: modelSelected?.name,
    messages,
    temperature: settings?.temperature ?? undefined,
    top_p: settings?.top_p ?? undefined,
    top_k: settings?.top_k ?? undefined,
  };
  if (settings?.limit_response_length && Number(settings?.max_tokens) > 0) {
    body.max_tokens = Number(settings.max_tokens);
  }
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const r = await axios.post(
    `${env.apiBaseUrl}${API_VERSION_PREFIX}/chat_api/completions/`,
    body,
    { headers, signal }
  );
  const data = r?.data || {};
  const text = data?.choices?.[0]?.message?.content || data?.text || '';
  return { text, raw: data };
}
