#!/usr/bin/env bash
# Build the Ozma Kapa web app and sync it into the Django backend's serve dir.
#
# The backend (itse500-django) serves the SPA at react.itse500-ok.ly:
#   - core/views.index renders the build's index.html (as a Django template),
#   - build/static/* is collected into Django staticfiles and served at /static/*,
#   - root assets (manifest.json, logos, robots.txt) are served by nginx/whitenoise.
#
# Usage:
#   BACKEND_DIR=/path/to/ITSE500-Django ./scripts/deploy-frontend.sh
# Requires a .env.production (REACT_APP_API_BASE_URL etc.) — baked in at build time.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="${BACKEND_DIR:-"$ROOT/../ITSE500-Django"}"
DEST="$BACKEND_DIR/frontend_build"

cd "$ROOT"
echo "==> Installing deps (npm ci)"
npm ci
echo "==> Building (uses .env.production)"
npm run build
if [ ! -f build/index.html ]; then
  echo "ERROR: build/index.html missing — the build failed" >&2
  exit 1
fi
echo "==> Syncing build/ -> $DEST"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -r build/. "$DEST"/
echo "==> Done."
echo
echo "Next, in the backend ($BACKEND_DIR):"
echo "  1) ensure frontend_build/index.html is on the Django template path"
echo "     (core/views.index renders the 'index.html' template)"
echo "  2) python manage.py collectstatic --noinput   # frontend_build/static -> /static/"
echo "  3) reload gunicorn / nginx"
