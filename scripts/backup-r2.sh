#!/usr/bin/env bash
# Back up the full git history to Cloudflare R2 as a bundle.
# Restore: wrangler r2 object get <bucket>/<repo>/latest.bundle --file repo.bundle --remote && git clone repo.bundle
set -euo pipefail
root=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
bucket=${R2_BACKUP_BUCKET:-juns-backup}
name=$(basename "$root")
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
stamp=$(date -u +%Y%m%dT%H%M%SZ)
git -C "$root" bundle create "$tmp/repo.bundle" --all
git -C "$root" bundle verify "$tmp/repo.bundle" >/dev/null
for key in "$name/history/$stamp.bundle" "$name/latest.bundle"; do
  wrangler r2 object put "$bucket/$key" --file "$tmp/repo.bundle" --content-type application/octet-stream --remote
done
echo "backed up $(git -C "$root" rev-parse --short HEAD) to r2://$bucket/$name/history/$stamp.bundle"
