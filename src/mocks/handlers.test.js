/**
 * Smoke test for the MSW mock layer itself.
 *
 * App.js does not call any of these endpoints yet (see the note in
 * src/mocks/handlers.js). This test exists to prove the mocking
 * infrastructure actually intercepts requests correctly *before* any real
 * component starts depending on it — so a future component test that
 * assumes "the network is mocked" fails loudly if the harness breaks,
 * rather than silently hitting a real backend.
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

test('mocks the Django login endpoint', async () => {
  const response = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', password: 'secret' }),
  });

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data).toMatchObject({ user: { email: 'user@example.com' } });
});

test('rejects a login request missing credentials', async () => {
  const response = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  expect(response.status).toBe(400);
});

test('mocks the Django health-check endpoint', async () => {
  const response = await fetch(`${API_BASE}/auth/health/`);
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ status: 'ok' });
});
