// Thin, OPT-IN typed-request helper layered over the existing core API client
// (`src/core/apiClient.js`). This does NOT replace that client — it adds
// compile-time path/method/response typing (derived from `schema.d.ts`, which
// is generated from the vendored `openapi/schema.yaml`) for call sites that
// choose to adopt it.
//
// Usage (from a .ts/.tsx call site, or via JSDoc typing in a .js file):
//
//   import { typedGet, typedPost } from '../api/typedClient';
//
//   const { data } = await typedGet('/api/v1/user_mang/me/');
//   const { data } = await typedPost('/api/v1/auth_api/login/', { identifier, user_password });
//
// `data` is typed from the schema's response body for that path+method+status,
// and the request body (for typedPost/typedPatch) is typed from the schema's
// requestBody. Runtime behavior (base URL selection, failover, 401 refresh,
// PATCH/DELETE shims) is delegated entirely to `api` from `../core/apiClient`
// — this file only adds types around it.
//
// This is intentionally NOT wired into any existing call site yet; see the
// adoption notes in the accompanying PR/report for where to start.

import type { paths } from './schema';
// The core client is plain JS with no type declarations; `require` keeps this
// import from forcing `noImplicitAny` errors on the untyped module boundary.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { api } = require('../core/apiClient') as { api: CoreApi };

interface CoreApi {
  get: (path: string, opts?: unknown) => Promise<unknown>;
  post: (path: string, body?: unknown, opts?: unknown) => Promise<unknown>;
  patch: (path: string, body?: unknown, opts?: unknown) => Promise<unknown>;
  del: (path: string, opts?: unknown) => Promise<unknown>;
}

type PathsWithMethod<M extends string> = {
  [P in keyof paths]: paths[P] extends Record<M, unknown> ? P : never;
}[keyof paths];

type GetPaths = PathsWithMethod<'get'>;
type PostPaths = PathsWithMethod<'post'>;
type PatchPaths = PathsWithMethod<'patch'>;
type DeletePaths = PathsWithMethod<'delete'>;

type JsonResponseOf<Op> = Op extends {
  responses: infer R;
}
  ? R extends Record<number, unknown>
    ? {
        [S in keyof R]: R[S] extends { content: { 'application/json': infer J } }
          ? J
          : never;
      }[keyof R]
    : never
  : never;

type JsonRequestBodyOf<Op> = Op extends {
  requestBody?: { content: { 'application/json': infer J } };
}
  ? J
  : never;

type OperationOf<P extends keyof paths, M extends string> = paths[P] extends Record<
  M,
  infer Op
>
  ? Op
  : never;

export interface TypedResponse<T> {
  data: T;
  status: number;
  headers: unknown;
}

// GET — path params/query are left to the caller via `opts.params` (matching
// the existing core client's calling convention); only the response body is
// typed here to keep this wrapper thin.
export async function typedGet<P extends GetPaths>(
  path: P,
  opts?: { params?: Record<string, unknown>; headers?: Record<string, string> }
): Promise<TypedResponse<JsonResponseOf<OperationOf<P, 'get'>>>> {
  return api.get(path as string, opts) as Promise<
    TypedResponse<JsonResponseOf<OperationOf<P, 'get'>>>
  >;
}

export async function typedPost<P extends PostPaths>(
  path: P,
  body?: JsonRequestBodyOf<OperationOf<P, 'post'>>,
  opts?: { headers?: Record<string, string> }
): Promise<TypedResponse<JsonResponseOf<OperationOf<P, 'post'>>>> {
  return api.post(path as string, body, opts) as Promise<
    TypedResponse<JsonResponseOf<OperationOf<P, 'post'>>>
  >;
}

export async function typedPatch<P extends PatchPaths>(
  path: P,
  body?: JsonRequestBodyOf<OperationOf<P, 'patch'>>,
  opts?: { headers?: Record<string, string> }
): Promise<TypedResponse<JsonResponseOf<OperationOf<P, 'patch'>>>> {
  return api.patch(path as string, body, opts) as Promise<
    TypedResponse<JsonResponseOf<OperationOf<P, 'patch'>>>
  >;
}

export async function typedDel<P extends DeletePaths>(
  path: P,
  opts?: { data?: unknown; headers?: Record<string, string> }
): Promise<TypedResponse<JsonResponseOf<OperationOf<P, 'delete'>>>> {
  return api.del(path as string, opts) as Promise<
    TypedResponse<JsonResponseOf<OperationOf<P, 'delete'>>>
  >;
}
