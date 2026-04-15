#!/usr/bin/env bash
# Fails if dist/ contains references to external URLs that would cause runtime fetches.
# Namespace URIs (e.g. http://www.w3.org/2000/svg in inline SVG) are allowed;
# they are XML identifiers, not network fetches.
set -u

if [ ! -d dist ]; then
  echo "ERROR: dist/ not found. Run 'vite build' first." >&2
  exit 1
fi

matches=$(grep -rEn 'https?://' dist/ \
  --include='*.js' --include='*.mjs' --include='*.html' --include='*.css' \
  2>/dev/null \
  | grep -Ev 'www\.w3\.org|xmlns|sourceMappingURL' \
  || true)

if [ -n "$matches" ]; then
  echo "ERROR: runtime external URL references found in dist/:" >&2
  echo "$matches" >&2
  exit 1
fi

echo "OK: no runtime http(s):// references in dist/"
