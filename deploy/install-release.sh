#!/usr/bin/env bash
set -euo pipefail
cd /srv/dsbr
release=${1:?release SHA required}
[[ "$release" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid release SHA'; exit 1; }
set -a
source .env
set +a
image="dsbr:$release"
previous=$(cat current-release 2>/dev/null || true)
replaced=false
compose=(docker compose --env-file .env -f compose.yml)
undrain() { curl --fail --silent -X POST -H "Authorization: Bearer $ADMIN_SECRET" http://127.0.0.1:8080/admin/undrain >/dev/null; }
rollback_on_error() {
  local status=$?
  if [[ $status != 0 && "$replaced" == true && -n "$previous" ]]; then
    SERVER_IMAGE="dsbr:$previous" DRAIN_ON_START=false "${compose[@]}" up -d --no-deps game
    echo "Restored server $previous; matching client restoration must be verified."
  fi
  undrain || true
  exit "$status"
}
trap rollback_on_error ERR
docker load -i "incoming/$release/server-image.tar"
if curl --fail --silent http://127.0.0.1:8080/healthz >/dev/null; then
  docker run --rm --network host -e ADMIN_SECRET -e DRAIN_TIMEOUT_MS=600000 -v /srv/dsbr/tools:/tools:ro "$image" node /tools/deploy/drain.mjs
fi
replaced=true
SERVER_IMAGE="$image" DRAIN_ON_START=true "${compose[@]}" up -d --no-deps game
healthy=false
for _ in {1..30}; do
  if curl --fail --silent http://127.0.0.1:8080/healthz >/dev/null; then healthy=true; break; fi
  sleep 2
done
[[ "$healthy" == true ]] || { echo 'New server unhealthy'; exit 1; }
actual=$(curl --fail --silent http://127.0.0.1:8080/version)
[[ "$actual" == *"\"buildId\":\"$release\""* ]] || { echo 'Unexpected server build'; exit 1; }
printf '%s\n' "$previous" > previous-release
printf '%s\n' "$release" > current-release
mkdir -p assets-archive
tar -xf "incoming/$release/client-assets.tar" -C assets-archive
tar -cf "incoming/$release/assets-archive.tar" -C assets-archive .
echo 'SERVER_STAGED_DRAINED: perform public WSS verification and matching Pages publication, then undrain.'
