#!/usr/bin/env bash
# このリポジトリのルートで git pull（ローカルを GitHub の最新に合わせる）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
exec git pull --ff-only origin "$BRANCH"
