# Changelog

Dated, area-grouped summaries of notable changes to itse500-react. Not a full commit
log — see `git log` for that.

## 2026-07-07 — MVP prep (Ozma Kapa)

Replaced the DigitalOcean sample-react starter with the real Ozma Kapa multi-provider
AI chat app and brought it to MVP-ready shape.

**Config**
- Centralized all `REACT_APP_*` reads behind `src/config/env.js` — the single source
  of truth; nothing else reads `process.env` directly.
- Removed dev-host fallbacks (`localhost`/LAN IPs) from production builds; added
  `validateEnv()` to fail loudly at startup if `REACT_APP_API_BASE_URL` /
  `REACT_APP_AUTH_BASE_URL` are missing in production.
- Added `.env.example`, `.env.production` convention, and `.npmrc`
  (`legacy-peer-deps=true`, required by CRA5 + React 19).

**Security / branding**
- Removed an API-key console leak.
- Sanitized auth error messages surfaced to the UI.
- Gated verbose logging behind dev-only checks.

**i18n**
- Added bilingual English/Arabic support with full RTL layout across all screens,
  via `i18next` + `react-i18next` and a `LanguageSwitcher` component.

**Auth**
- Unified 401 → token-refresh handling into the core API client
  (`src/core/tokenRefresh.js`), replacing ad-hoc per-call refresh logic.

**Chat**
- Added a flag-gated (default-off) managed-LLM provider seam
  (`src/features/user-home-page/logic/connectManagedAI.js`) so the app can route
  through a server-proxied/billed LLM path once the backend exposes it, without
  disturbing the existing BYO-key path.
- Backend-blocked features (password reset, feedback submission, managed LLM) are
  gated behind default-off flags — `REACT_APP_ENABLE_PASSWORD_RESET`,
  `REACT_APP_ENABLE_FEEDBACK`, `REACT_APP_ENABLE_MANAGED_LLM` — until their backend
  endpoints exist.

**Tests / CI**
- Added an app-level `ErrorBoundary` with tests.
- Added Jest coverage for the config contract (`src/config/env.test.js`) and i18n
  key-parity between `en.json`/`ar.json` (`src/i18n/i18n.test.js`).
- Added `.github/workflows/ci.yml` implementing the shared install → lint → test →
  build pipeline convention documented in `docs/ci-and-testing.md` (shared across
  itse500-react, itse500-django, itse500-flutter).

**Deploy**
- Added `.nvmrc` (Node 20) and `engines` in `package.json`.
- Added `scripts/deploy-frontend.sh` and `npm run deploy:frontend` to build and sync
  `build/` into the `itse500-django` backend's `frontend_build/`.
- Documented the full deploy procedure, including an nginx CSP tuned for MUI inline
  styles, base64 image responses, and direct-to-provider BYO-key calls, in
  `docs/deploy.md`.

**API**
- Vendored the backend's OpenAPI schema at `openapi/schema.yaml` and added
  `npm run gen:api` (`openapi-typescript`) to generate `src/api/schema.d.ts`,
  consumed by `src/api/typedClient.ts`.
- Added an api-drift CI gate to catch a stale generated schema file.
