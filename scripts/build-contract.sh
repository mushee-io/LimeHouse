#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

docker pull quay.io/ultra.io/3rdparty-devtools:latest

docker run --rm \
  -v "$ROOT:/opt/ultra_workdir/LimeHouse" \
  quay.io/ultra.io/3rdparty-devtools:latest \
  bash -lc 'cd /opt/ultra_workdir/LimeHouse/contracts/limeb && cdt-cpp -o limeb.wasm limeb.cpp'

echo "Built contracts/limeb/limeb.wasm and contracts/limeb/limeb.abi"
