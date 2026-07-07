# CI & Testing — shared convention (itse500-react · itse500-django · itse500-flutter)

The three ITSE500 repos share one CI shape so contributors get the same signal everywhere.
Each repo owns a single `.github/workflows/ci.yml`.

## Shared contract

- **Trigger:** `push` and `pull_request` to `main`.
- **Concurrency:** `group: ci-${{ github.workflow }}-${{ github.ref }}`, `cancel-in-progress: true` (a new push cancels the stale run).
- **Pipeline (in order):** `install → lint → test (+coverage) → build`.
- **Lint is non-blocking** (`continue-on-error: true`) for now, because all three repos carry pre-existing lint warnings; tighten to blocking once each backlog is cleared.
- **Job naming:** `"<layer> (<stack>)"` → `web (react)`, `backend (django)`, `mobile (flutter)`.
- Runner: `ubuntu-latest`.

## Per-repo specifics

| Repo | Toolchain | Lint | Test (+coverage) | Build/Check |
|------|-----------|------|------------------|-------------|
| **react** (this) | Node 20, `npm ci` (needs `.npmrc` `legacy-peer-deps` — CRA5 vs React 19) | `eslint src` | `react-scripts test --watchAll=false --coverage` (Jest) | `CI=false npm run build` |
| **django** | Python 3.13, pip | `ruff check` + `ruff format --check` | `pytest --cov` (SQLite; no service containers) | `python manage.py check` (+ `pip-audit`) |
| **flutter** | `subosito/flutter-action` @ 3.24.3 | `flutter analyze` | `flutter test` | `flutter build web --release` |

Django CI implements its own `MODERNIZATION_PLAN.md` Phase 7 (ruff + pytest-cov + check + pip-audit). Flutter keeps its existing tag-triggered `release.yml` (multi-platform builds) separate from this PR/push CI.

## Running tests locally

- **react:** `npm test` (watch) or `CI=true npm test -- --watchAll=false`.
  - ⚠️ In this git *worktree* (path under `.claude/worktrees/…`) Jest's default `testMatch` glob fails to match on Windows because of a mixed-slash rootDir. Locally, add `--testMatch "**/*.test.{js,jsx}"`. CI checks out to a clean path and needs no override.
- **django:** `pytest`
- **flutter:** `flutter test`

## React test suite (what's covered)

- `src/config/env.test.js` — the F0 config contract: no dev-host leakage, `validateEnv()` fail-loud, feature flags default off.
- `src/i18n/i18n.test.js` — the F7 invariant: `en.json` ↔ `ar.json` key-path parity (catches translation drift), no empty strings.
- `src/components/ErrorBoundary.test.jsx` — the app-level error boundary renders children normally and a fallback alert on a child throw.

Component tests that import `react-router-dom` v7 do **not** run under CRA's bundled Jest resolver (it doesn't read the package's `exports` map); those are intentionally omitted until the app migrates off CRA (e.g. to Vite/Vitest).
