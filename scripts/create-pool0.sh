#!/usr/bin/env bash
set -euo pipefail

ACCOUNT="${LIMEB_ACCOUNT:-1aa2aa3aa4wr}"
RPC="${ULTRA_TESTNET_RPC:-https://ultra-testnet.eosphere.io}"
TOKEN0="${LIMEB_POOL0_TOKEN0:-8,UOS}"
TOKEN1="${LIMEB_POOL0_TOKEN1:-6,USDT}"
FEE_BPS="${LIMEB_POOL0_FEE_BPS:-30}"

if ! command -v cleos >/dev/null 2>&1; then
  echo "cleos is required. Run this inside Ultra's developer Docker image."
  exit 1
fi

symbol_code() {
  printf '%s' "$1" | awk -F, '{print $2}'
}

TOKEN0_CODE="$(symbol_code "$TOKEN0")"
TOKEN1_CODE="$(symbol_code "$TOKEN1")"

echo "Lime B Pool 0 bootstrap"
echo "  Contract: $ACCOUNT"
echo "  RPC:      $RPC"
echo "  Pair:     $TOKEN0 / $TOKEN1"
echo "  Fee:      $FEE_BPS bps"

echo
echo "Checking token definitions on eosio.token..."
STATS0="$(cleos -u "$RPC" get currency stats eosio.token "$TOKEN0_CODE")"
STATS1="$(cleos -u "$RPC" get currency stats eosio.token "$TOKEN1_CODE")"

if [[ "$STATS0" == "{}" ]]; then
  echo "Token $TOKEN0_CODE does not exist on eosio.token."
  exit 1
fi

if [[ "$STATS1" == "{}" ]]; then
  echo "Token $TOKEN1_CODE does not exist on eosio.token."
  exit 1
fi

echo "  $TOKEN0_CODE: found"
echo "  $TOKEN1_CODE: found"

echo
echo "Checking existing Lime B pools..."
POOLS="$(cleos -u "$RPC" get table "$ACCOUNT" "$ACCOUNT" pools --limit 100)"

if printf '%s' "$POOLS" | python3 -c 'import json,sys; d=json.load(sys.stdin); raise SystemExit(0 if d.get("rows") else 1)'; then
  echo "A Lime B pool already exists. Refusing to create another Pool 0."
  printf '%s\n' "$POOLS"
  exit 0
fi

echo
echo "Creating Pool 0..."
cleos -u "$RPC" push action "$ACCOUNT" createpool   "[\"$TOKEN0\",\"$TOKEN1\",$FEE_BPS]"   -p "$ACCOUNT@active"

echo
echo "Verifying Pool 0..."
cleos -u "$RPC" get table "$ACCOUNT" "$ACCOUNT" pools --limit 10

echo
echo "Pool 0 bootstrap complete."
