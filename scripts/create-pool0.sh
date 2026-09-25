#!/usr/bin/env bash
set -euo pipefail

ACCOUNT="${LIMEB_ACCOUNT:-1aa2aa3aa4wr}"
RPC="${ULTRA_TESTNET_RPC:-https://ultra-testnet.eosphere.io}"
TOKEN0="${LIMEB_POOL0_TOKEN0:-8,UOS}"
TOKEN1="${LIMEB_POOL0_TOKEN1:-6,LIME}"
TOKEN0_CONTRACT="${LIMEB_POOL0_TOKEN0_CONTRACT:-eosio.token}"
TOKEN1_CONTRACT="${LIMEB_POOL0_TOKEN1_CONTRACT:-1aa2aa3aa4ws}"
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
echo "Checking token definitions..."
STATS0="$(cleos -u "$RPC" get currency stats "$TOKEN0_CONTRACT" "$TOKEN0_CODE")"
STATS1="$(cleos -u "$RPC" get currency stats "$TOKEN1_CONTRACT" "$TOKEN1_CODE")"

if [[ "$STATS0" == "{}" ]]; then
  echo "Token $TOKEN0_CODE does not exist on $TOKEN0_CONTRACT."
  exit 1
fi

if [[ "$STATS1" == "{}" ]]; then
  echo "Token $TOKEN1_CODE does not exist on $TOKEN1_CONTRACT."
  exit 1
fi

echo "  $TOKEN0_CODE: found on $TOKEN0_CONTRACT"
echo "  $TOKEN1_CODE: found on $TOKEN1_CONTRACT"

echo
echo "Registering tokens with Lime B..."
cleos -u "$RPC" push action "$ACCOUNT" regtoken   "[\"$TOKEN0_CONTRACT\",\"$TOKEN0\",true]"   -p "$ACCOUNT@active"
cleos -u "$RPC" push action "$ACCOUNT" regtoken   "[\"$TOKEN1_CONTRACT\",\"$TOKEN1\",true]"   -p "$ACCOUNT@active"

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
