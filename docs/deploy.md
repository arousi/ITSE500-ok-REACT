# Deploy — Ozma Kapa web (itse500-react)

The web app ships as a static CRA build served by the **itse500-django** backend
on the VPS at `https://react.itse500-ok.ly`. The API is at `https://www.itse500-ok.ly`.
Node is pinned via `.nvmrc` (20) + `engines` in `package.json`.

## 1. Build-time env
Create `.env.production` (gitignored) on the build host — CRA bakes these into the bundle:
```
REACT_APP_API_BASE_URL=https://www.itse500-ok.ly
REACT_APP_AUTH_BASE_URL=https://www.itse500-ok.ly
GENERATE_SOURCEMAP=false
# optional flags (default off): REACT_APP_ENABLE_MANAGED_LLM / _PASSWORD_RESET / _FEEDBACK
```

## 2. Build + sync into the backend
```
BACKEND_DIR=/path/to/ITSE500-Django npm run deploy:frontend
```
Runs `npm ci && npm run build` and copies `build/` into the backend's `frontend_build/`.
Then in the backend:
- ensure `frontend_build/index.html` resolves as the `index.html` template (core/views.index renders it),
- `python manage.py collectstatic --noinput` (serves `frontend_build/static` at `/static/`),
- reload gunicorn.

Deep links (`/dashboard/...`) resolve via the backend SPA catch-all (`prompeteer_server/urls.py`).
The built asset paths are absolute (`/static/js|css/...`), which already map onto Django's `STATIC_URL=/static/` — no `homepage`/`PUBLIC_URL` change needed.

## 3. nginx — TLS + security headers (incl. CSP)
nginx terminates TLS and reverse-proxies to gunicorn. Add security headers, including a
CSP tuned for this app (MUI injects inline styles; image models return base64; BYO-key
mode calls provider hosts directly from the browser):

```nginx
server {
  server_name react.itse500-ok.ly;
  listen 443 ssl http2;
  # ssl_certificate / ssl_certificate_key via certbot

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https:; connect-src 'self' https://www.itse500-ok.ly https://openrouter.ai https://api.openai.com https://generativelanguage.googleapis.com https://huggingface.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;

  location / {
    proxy_pass http://127.0.0.1:8000;   # gunicorn
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

### CSP notes
- `style-src 'unsafe-inline'` — required by Emotion/MUI.
- `img-src data:` — base64 images from image models.
- `connect-src` must list every host the browser calls directly in BYO-key mode (API host + Google/OpenRouter/OpenAI/HuggingFace). **Update it when providers change.** When the managed (server-proxied) path is the only one enabled, this can be tightened to just the API host.
- The real fix for the `localStorage`-token XSS surface is **HttpOnly-cookie auth** — a backend change to coordinate with itse500-django; the CSP is defense-in-depth until then.

## Coordination
Same VPS/compose stack as itse500-django **Phase 8**. Fold `deploy:frontend` (or a
Docker build stage that emits `frontend_build/`) into that pipeline. CI conventions
across the three repos: see [ci-and-testing.md](ci-and-testing.md).
