# Testing — itse500-ok-REACT (web client)

Part of the ITSE500 3-repo test/CI **sync** (Django API + Flutter desktop + this React web client). Django (`itse500-django`) is the API contract source of truth.

## Test tiers
- **Unit / component** — Jest + React Testing Library (`src/**/*.test.js`).
  `CI=true yarn test --watchAll=false` (or `npx react-scripts test --watchAll=false`).
- **API mocking** — [MSW](https://mswjs.io/) in `src/mocks/` intercepts Django API calls so component tests are hermetic (no real backend).
- **E2E** — [Playwright](https://playwright.dev/) in `e2e/`. `yarn test:e2e`. Targets `E2E_BASE_URL` (default `http://localhost:3000`); point it at the running backend/app for integration.
- **Contract** — `src/__tests__/contract/` validates this app's API calls against Django's OpenAPI (`contract/openapi.yaml`). Currently **skips** until that schema is vendored in — see the TODO in `api-contract.test.js`.

## CI (GitHub Actions)
- `.github/workflows/ci.yml` — `lint` → `test` (coverage artifact) → `build`, on push to `main` + PRs.
- `.github/workflows/e2e.yml` — Playwright on manual `workflow_dispatch` against `E2E_BASE_URL` (not a PR gate yet).

## Local quick start
```bash
yarn install                              # or: npm install
CI=true yarn test --watchAll=false        # unit + contract (contract skips until schema present)
yarn lint                                 # eslint src
yarn test:e2e                             # needs a target at E2E_BASE_URL
```

## Contract sync — TODO
Django publishes `contract/openapi.yaml` via drf-spectacular (its `contract` CI job). To finish the sync here:
1. Vendor/fetch that `openapi.yaml` into this repo (CI artifact download or submodule — match the other repos).
2. Implement real request/response validation in `src/__tests__/contract/` (e.g. `ajv` + OpenAPI→JSONSchema), or generate a typed client via `openapi-typescript`.
