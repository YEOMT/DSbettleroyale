#!/usr/bin/env bash
set -euo pipefail
root=${DEPLOY_STATE_DIR:?Set absolute bootstrap state directory}
script_dir=$(cd -- "$(dirname -- "$0")" && pwd)
exec python3 "$script_dir/../tools/deploy/host.py" "$root" "${1:?target}" "${2:?action}" "${3:-}"
