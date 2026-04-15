#!/usr/bin/env bash
# Post-edit syntax check. Runs node --check on .js files, skips everything else.
# Non-zero exit surfaces the error back to Claude.
set -u

paths="${1:-}"
[ -z "$paths" ] && exit 0

status=0
for f in $paths; do
  case "$f" in
    *.js|*.mjs)
      if [ -f "$f" ]; then
        node --check "$f" || status=$?
      fi
      ;;
    *)
      : # skip .html, .css, .json, .md, .csv, etc.
      ;;
  esac
done
exit $status
