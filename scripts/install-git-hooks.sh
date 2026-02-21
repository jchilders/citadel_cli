#!/bin/sh

set -e

REPO_ROOT="$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)"
HOOK_SOURCE_DIR="$REPO_ROOT/scripts/git-hooks"
HOOK_DEST_DIR="$REPO_ROOT/.git/hooks"

if [ ! -d "$HOOK_DEST_DIR" ]; then
  echo "Error: .git/hooks directory not found. Run this from a Git working tree."
  exit 1
fi

cp "$HOOK_SOURCE_DIR/pre-push" "$HOOK_DEST_DIR/pre-push"
cp "$HOOK_SOURCE_DIR/pre-merge-commit" "$HOOK_DEST_DIR/pre-merge-commit"
cp "$HOOK_SOURCE_DIR/run-preflight-checks.sh" "$HOOK_DEST_DIR/run-preflight-checks.sh"

chmod +x \
  "$HOOK_DEST_DIR/pre-push" \
  "$HOOK_DEST_DIR/pre-merge-commit" \
  "$HOOK_DEST_DIR/run-preflight-checks.sh"

echo "Installed Git hooks:"
echo "  - pre-push"
echo "  - pre-merge-commit (main only)"
