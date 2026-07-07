# openapi/schema.yaml

This is a **vendored, checked-in copy** of the Django backend's published OpenAPI
contract (`api/schema.yaml` in the `itse500-django` repo). It is the single
source of truth this app's typed client is generated from.

## Sync policy

- This file is **not hand-edited**. When the backend contract changes, copy the
  updated `api/schema.yaml` from the Django repo over this file.
- After updating it, regenerate the typed client:

  ```
  npm run gen:api
  ```

  This writes `src/api/schema.d.ts` from this schema. Commit both files together.
- CI (`.github/workflows/ci.yml`, job `api-drift`) regenerates `src/api/schema.d.ts`
  from this vendored schema and fails the build if the committed file is stale
  (`git diff --exit-code src/api/schema.d.ts`). This is a drift gate, not a
  schema-freshness gate — it only catches "schema.yaml changed but the generated
  types weren't regenerated." Keeping `openapi/schema.yaml` itself in sync with
  the backend is a manual step (or a future cross-repo sync job) for now.

## Adoption

`src/api/schema.d.ts` provides typed `paths`/`components` from `openapi-typescript`.
`src/api/typedClient.js` offers a thin, opt-in typed-request helper built on top
of the existing `src/core/apiClient.js` axios/fetch client — it does not replace
that client. See that file's header comment for adoption notes.
