# Ozma Kapa — web (itse500-react)

Ozma Kapa is a bilingual (English/Arabic, full RTL) multi-provider AI chat web app.
Users bring their own API key (Gemini, OpenRouter, OpenAI, HuggingFace) or, once the
backend billing/proxy is live, use a managed-key tier gated behind a feature flag.
This repo is the React front end; it is served as a static build by the
`itse500-django` backend.

## Tech stack

- React 19 + MUI 7 (Emotion, with `stylis-plugin-rtl` for RTL styling)
- Create React App / `react-scripts` 5
- `i18next` + `react-i18next` for en/ar translations, `LanguageSwitcher` for runtime switching
- `axios` for HTTP, with a shared token-refresh interceptor in `src/core/tokenRefresh.js`
- Feature-sliced structure under `src/features/*` (`auth`, `login`, `register`, `register-OTP`,
  `forgot-password`, `dashboard`, `dashboard-auth`, `history`, `profile`, `settings`,
  `send-feedback`, `user-home-page`)
- API types generated from a vendored OpenAPI schema (`openapi/schema.yaml` → `src/api/schema.d.ts`)

## Prerequisites

- Node.js version pinned in `.nvmrc` (currently 20) — `engines` in `package.json` requires
  `>=18 <23`. If you use `nvm`, run `nvm use` in this directory.
- npm (ships with Node)

## Install

```
npm install
```

`.npmrc` sets `legacy-peer-deps=true` — required because `react-scripts` 5 pins peer
deps to React 18 and conflicts with React 19 / i18next's optional TypeScript 5 peer.
Keep using `npm install`/`npm ci` (not a peer-deps-strict install) until the app
migrates off CRA.

## Run (development)

```
npm start
```

Opens at [http://localhost:3000](http://localhost:3000). Copy `.env.example` to
`.env.development.local` and fill in `REACT_APP_API_BASE_URL` /
`REACT_APP_AUTH_BASE_URL` to point at a local or remote backend — see
[Configuration](#configuration) below.

## Test

```
npm test
```

Runs `react-scripts test` (Jest) in watch mode; `CI=true npm test -- --watchAll=false`
for a single run with coverage-friendly output.

> If you're running tests **inside this `.claude/worktrees/...` worktree on Windows**,
> Jest's default `testMatch` glob can fail to match files because of a mixed-slash
> rootDir. Add an explicit match:
> ```
> npm test -- --testMatch "**/*.test.{js,jsx}"
> ```
> This is a local worktree quirk only — CI checks out to a clean path and needs no
> override. See [docs/ci-and-testing.md](docs/ci-and-testing.md) for the full CI
> contract shared across the three ITSE500 repos (react/django/flutter).

## Build (production)

```
npm run build
```

Requires `.env.production` with the real `REACT_APP_API_BASE_URL` /
`REACT_APP_AUTH_BASE_URL` set (CRA bakes `REACT_APP_*` vars in at build time — there
are no dev-host fallbacks in a production build; `validateEnv()` fails loudly at
startup if either is missing). See [docs/deploy.md](docs/deploy.md) for the full
build → sync → nginx/CSP deployment procedure.

## Configuration

All `REACT_APP_*` env vars are read through the single source of truth
`src/config/env.js` — nothing else in the app should read `process.env` directly.
Copy [`.env.example`](.env.example) to get started; key vars:

| Var | Purpose |
|---|---|
| `REACT_APP_API_BASE_URL` | Django API host. Required in production. |
| `REACT_APP_AUTH_BASE_URL` | Auth endpoint host. Required in production. |
| `REACT_APP_AUTH_API_BASE_URL` | Explicit auth API base; derived from `REACT_APP_AUTH_BASE_URL` if unset. |
| `REACT_APP_SECONDARY_API_BASE_URL` / `REACT_APP_TERTIARY_API_BASE_URL` | Optional failover API bases. Leave empty in production. |
| `REACT_APP_LOCAL_BACKEND_FIRST` | Dev convenience: prefer local backend on `localhost`. |
| `REACT_APP_OAUTH_SSR` / `REACT_APP_OAUTH_RESULT_ONLY` | OAuth SSR flow toggles; keep off unless the backend exposes the SSR endpoints. |
| `REACT_APP_ENABLE_MANAGED_LLM` | Feature flag for the managed (server-proxied) LLM tier. Default off; backend proxy/billing not live yet. |
| `REACT_APP_ENABLE_PASSWORD_RESET` | Feature flag for password-reset flow. Default off; no backend endpoint yet. |
| `REACT_APP_ENABLE_FEEDBACK` | Feature flag for in-app feedback submission. Default off; no backend endpoint yet. |
| `REACT_APP_GEMINI_SECRET_KEY` / `REACT_APP_OPENROUTER_SECRET_KEY` / `REACT_APP_OPENAI_SECRET_KEY` / `REACT_APP_HUGGINGFACE_SECRET_KEY` | Optional BYO-provider-key dev fallbacks. End users normally enter their own key in-app. |
| `REACT_APP_SENTRY_DSN` | Optional error-reporting DSN. |

## API types (OpenAPI codegen)

The backend's OpenAPI schema is vendored at `openapi/schema.yaml`. Regenerate the
TypeScript types after a backend contract change:

```
npm run gen:api
```

This writes `src/api/schema.d.ts` (consumed by `src/api/typedClient.ts`). CI runs an
api-drift check to catch a stale generated file.

## Further reading

- [docs/deploy.md](docs/deploy.md) — build, sync into `itse500-django`, nginx + CSP
- [docs/ci-and-testing.md](docs/ci-and-testing.md) — CI pipeline shape shared across
  itse500-react / itse500-django / itse500-flutter, and what the React test suite covers
- [docs/CHANGELOG.md](docs/CHANGELOG.md) — dated summary of notable changes
