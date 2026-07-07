import { rest } from "msw";

/**
 * MSW request handlers mirroring the Django API (`prompeteer_server`) endpoints.
 *
 * This React client (currently the unmodified DigitalOcean `sample-react`
 * scaffold) does not call any of these endpoints yet. These handlers exist so
 * that as soon as real API calls are wired up (auth, chat, etc.), tests never
 * hit a live backend — component/unit tests should rely on the MSW `server`
 * (see ./server.js) started in src/setupTests.js, and override per-test with
 * `server.use(...)` where needed.
 *
 * Endpoint shapes are kept intentionally close to the real Django routes in
 * `auth_api/urls.py` / `user_mang` / `chat_api` so they stay a useful stand-in
 * once real fetch/axios calls exist. Keep in sync with the Django OpenAPI
 * contract (`contract/openapi.yaml`) once it is published — see
 * src/__tests__/contract/ for the wiring plan.
 *
 * NOTE: pinned to MSW v1 (not v2) because CRA 5's frozen Babel/Jest toolchain
 * (`babel-preset-react-app`, not upgradable without ejecting) cannot parse
 * MSW v2's ESM-only transitive dependencies (static class blocks, etc.).
 */

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

export const handlers = [
  // --- auth_api ---
  rest.post(`${API_BASE}/auth/login/`, async (req, res, ctx) => {
    const body = await req.json();
    if (!body?.email || !body?.password) {
      return res(ctx.status(400), ctx.json({ detail: "email and password are required" }));
    }
    return res(
      ctx.status(200),
      ctx.json({
        access: "mock-access-token",
        refresh: "mock-refresh-token",
        user: { id: 1, email: body.email },
      })
    );
  }),

  rest.post(`${API_BASE}/auth/register/`, async (req, res, ctx) => {
    const body = await req.json();
    return res(ctx.status(201), ctx.json({ id: 1, email: body?.email, is_verified: false }));
  }),

  rest.post(`${API_BASE}/auth/verify-email-pin/`, async (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ verified: true }));
  }),

  rest.post(`${API_BASE}/auth/token/refresh/`, async (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ access: "mock-access-token" }));
  }),

  rest.get(`${API_BASE}/auth/health/`, async (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ status: "ok" }));
  }),

  // --- user_mang ---
  rest.post(`${API_BASE}/user/sync-conversations/`, async (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ synced: true, conversations: [] }));
  }),

  // --- chat_api ---
  rest.post(`${API_BASE}/chat/`, async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ id: "mock-message-id", role: "assistant", content: "mock response" })
    );
  }),
];
