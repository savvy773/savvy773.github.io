#!/usr/bin/env bash
# Deploy committed HEAD (not the working tree) to Cloudflare as Workers static assets.
set -euo pipefail
root=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
git -C "$root" archive HEAD | tar -x -C "$tmp"
cd "$tmp"
wrangler deploy "$@"

# Back up the git history to R2 after each deploy; a backup failure never undoes the deploy.
"$root/scripts/backup-r2.sh" || echo "warning: R2 backup failed" >&2
