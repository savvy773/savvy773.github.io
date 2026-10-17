#!/usr/bin/env bash
# Deploy committed HEAD (not the working tree) to Cloudflare as Workers static assets.
set -euo pipefail
root=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
git -C "$root" archive HEAD | tar -x -C "$tmp"
cd "$tmp"
wrangler deploy "$@"
