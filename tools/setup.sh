#!/usr/bin/env bash
# 解説動画づくりの環境を用意する(クラウドのLinuxコンテナ向け。何度実行しても安全)。
#   1) Docker デーモンを起動  2) VOICEVOX エンジンを起動  3) npm install
# 使い方: bash tools/setup.sh      終了: bash tools/setup.sh stop
set -euo pipefail
cd "$(dirname "$0")/.."
IMAGE=voicevox/voicevox_engine:cpu-latest
NAME=vv

if [ "${1:-}" = "stop" ]; then docker rm -f "$NAME" >/dev/null 2>&1 || true; echo "VOICEVOX stopped"; exit 0; fi

# 1) Docker デーモン(GitHub/Hugging Face には繋がらないが Docker Hub には繋がる)
if ! docker info >/dev/null 2>&1; then
  (dockerd >/tmp/dockerd.log 2>&1 &)
  for _ in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 1; done
fi
docker info >/dev/null 2>&1 || { echo "dockerd を起動できません。/tmp/dockerd.log を確認" >&2; exit 1; }

# 2) VOICEVOX エンジン(イメージ取得に数分かかる)
docker image inspect "$IMAGE" >/dev/null 2>&1 || docker pull "$IMAGE"
if ! curl -fsS -m 2 localhost:50021/version >/dev/null 2>&1; then
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  docker run -d --rm --name "$NAME" -p 127.0.0.1:50021:50021 "$IMAGE" >/dev/null
  for _ in $(seq 1 60); do curl -fsS -m 2 localhost:50021/version >/dev/null 2>&1 && break; sleep 2; done
fi
echo "VOICEVOX: $(curl -fsS localhost:50021/version)"

# 3) 依存パッケージ(Remotion)
[ -d node_modules ] || npm install --no-audit --no-fund
echo "ready"
