import { refreshAccessToken } from './tokenRefresh';

describe('core/tokenRefresh', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
    try { localStorage.clear(); } catch (_) {}
    jest.clearAllMocks();
  });

  test('returns null when there is no stored refresh token', async () => {
    localStorage.removeItem('auth');
    await expect(refreshAccessToken()).resolves.toBeNull();
  });

  test('refreshes and persists a new access token on success', async () => {
    localStorage.setItem('auth', JSON.stringify({ data: { access_token: 'old', refresh_token: 'r1' } }));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ access: 'new-access' }) });

    await expect(refreshAccessToken()).resolves.toBe('new-access');

    const stored = JSON.parse(localStorage.getItem('auth'));
    expect(stored.data.access_token).toBe('new-access');
    expect(stored.data.refresh_token).toBe('r1'); // preserved when server omits a new refresh
  });

  test('returns null when the refresh request fails', async () => {
    localStorage.setItem('auth', JSON.stringify({ data: { refresh_token: 'r1' } }));
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
    await expect(refreshAccessToken()).resolves.toBeNull();
  });

  test('concurrent refreshes share a single in-flight request (dedupe)', async () => {
    localStorage.setItem('auth', JSON.stringify({ data: { refresh_token: 'r1' } }));
    let calls = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      calls += 1;
      return Promise.resolve({ ok: true, json: async () => ({ access: 'A' }) });
    });
    const [a, b] = await Promise.all([refreshAccessToken(), refreshAccessToken()]);
    expect(a).toBe('A');
    expect(b).toBe('A');
    expect(calls).toBe(1); // both callers shared one fetch
  });
});
