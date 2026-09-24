#!/usr/bin/env bash
set -euo pipefail

ACCOUNT="${LIMEB_ACCOUNT:-1aa2aa3aa4wr}"
RPC="${ULTRA_TESTNET_RPC:-https://ultra-testnet.eosphere.io}"
CONTRACT_DIR="${CONTRACT_DIR:-contracts/limeb}"

WASM="$CONTRACT_DIR/limeb.wasm"
ABI="$CONTRACT_DIR/limeb.abi"

if ! command -v cleos >/dev/null 2>&1; then
  echo "cleos is required. Use the Ultra developer Docker image or Ultra tooling."
  exit 1
fi

if [[ ! -s "$WASM" || ! -s "$ABI" ]]; then
  echo "Compiled contract not found. Build it first with: bash scripts/build-contract.sh"
  exit 1
fi

echo "Deploying Lime B to Ultra Testnet account: $ACCOUNT"
echo "RPC: $RPC"

# The signing key must already exist in your local wallet.
# Never place a private key in this script or commit one to GitHub.
cleos -u "$RPC" set contract "$ACCOUNT" "$CONTRACT_DIR" limeb.wasm limeb.abi -p "$ACCOUNT@active"

echo "Adding eosio.code permission for inline token payouts..."
cleos -u "$RPC" set account permission "$ACCOUNT" active --add-code "$ACCOUNT" owner -p "$ACCOUNT@active"

echo "Verifying deployed code..."
cleos -u "$RPC" get code "$ACCOUNT"

echo "Lime B deployment submitted."
