#!/usr/bin/env bash
set -euo pipefail

RPC="${ULTRA_TESTNET_RPC:-https://ultra-testnet.eosphere.io}"
DEX="${LIMEB_ACCOUNT:-1aa2aa3aa4wr}"
LIME_TOKEN="${LIME_TOKEN_CONTRACT:-1aa2aa3aa4ws}"
LIME_ISSUER="${LIME_ISSUER:-1aa2aa3aa4ws}"
LIME_MAX="${LIME_MAX_SUPPLY:-1000000.000000 LIME}"
LIME_ISSUE="${LIME_INITIAL_ISSUE:-10000.000000 LIME}"

if ! command -v cdt-cpp >/dev/null 2>&1 || ! command -v cleos >/dev/null 2>&1; then
  echo "Run this script inside Ultra's 3rdparty-devtools container."
  exit 1
fi

echo "=== Build Lime B AMM ==="
(
  cd contracts/limeb
  cdt-cpp -o limeb.wasm limeb.cpp
)

echo "=== Build LIME test token ==="
(
  cd contracts/limetoken
  cdt-cpp -o limetoken.wasm limetoken.cpp
)

echo "=== Deploy upgraded Lime B AMM to $DEX ==="
cleos -u "$RPC" set contract "$DEX" contracts/limeb limeb.wasm limeb.abi -p "$DEX@active"

echo "=== Deploy LIME test token to $LIME_TOKEN ==="
cleos -u "$RPC" set contract "$LIME_TOKEN" contracts/limetoken limetoken.wasm limetoken.abi -p "$LIME_TOKEN@active"

echo "=== Create LIME if needed ==="
LIME_STATS="$(cleos -u "$RPC" get currency stats "$LIME_TOKEN" LIME)"
if [[ "$LIME_STATS" == "{}" ]]; then
  cleos -u "$RPC" push action "$LIME_TOKEN" create     "[\"$LIME_ISSUER\",\"$LIME_MAX\"]"     -p "$LIME_TOKEN@active"
else
  echo "LIME already exists; skipping create."
fi

echo "=== Issue initial LIME if LP balance is empty ==="
LIME_BALANCE="$(cleos -u "$RPC" get currency balance "$LIME_TOKEN" "$LIME_ISSUER" LIME)"
if [[ -z "$LIME_BALANCE" ]]; then
  cleos -u "$RPC" push action "$LIME_TOKEN" issue     "[\"$LIME_ISSUER\",\"$LIME_ISSUE\",\"Lime B Testnet liquidity\"]"     -p "$LIME_ISSUER@active"
else
  echo "Issuer already has LIME: $LIME_BALANCE"
fi

echo "=== Register token contracts in Lime B ==="
cleos -u "$RPC" push action "$DEX" regtoken   "[\"eosio.token\",\"8,UOS\",true]"   -p "$DEX@active"

cleos -u "$RPC" push action "$DEX" regtoken   "[\"$LIME_TOKEN\",\"6,LIME\",true]"   -p "$DEX@active"

echo "=== Replace empty legacy Pool 0 if necessary ==="
POOL_JSON="$(cleos -u "$RPC" get table "$DEX" "$DEX" pools --lower 0 --upper 1 --limit 1)"

POOL_STATE="$(printf '%s' "$POOL_JSON" | python3 -c '
import json, sys
d=json.load(sys.stdin)
rows=d.get("rows",[])
if not rows:
    print("missing")
else:
    p=rows[0]
    if p.get("reserve0") == "0.00000000 UOS" and p.get("reserve1") == "0.000000 USDT" and int(p.get("total_shares",0)) == 0:
        print("legacy-empty")
    elif p.get("reserve0") == "0.00000000 UOS" and p.get("reserve1") == "0.000000 LIME" and int(p.get("total_shares",0)) == 0:
        print("lime-empty")
    elif str(p.get("reserve0","")).endswith(" UOS") and str(p.get("reserve1","")).endswith(" LIME"):
        print("lime-live")
    else:
        print("other")
')"

case "$POOL_STATE" in
  legacy-empty)
    cleos -u "$RPC" push action "$DEX" erasepool '[0]' -p "$DEX@active"
    cleos -u "$RPC" push action "$DEX" createpool '["8,UOS","6,LIME",30]' -p "$DEX@active"
    ;;
  missing)
    cleos -u "$RPC" push action "$DEX" createpool '["8,UOS","6,LIME",30]' -p "$DEX@active"
    ;;
  lime-empty|lime-live)
    echo "UOS/LIME Pool 0 already exists."
    ;;
  *)
    echo "Pool 0 is not the expected empty legacy pool. Refusing to replace it."
    cleos -u "$RPC" get table "$DEX" "$DEX" pools --limit 10
    exit 1
    ;;
esac

echo
echo "=== Token registry ==="
cleos -u "$RPC" get table "$DEX" "$DEX" tokens --limit 20

echo
echo "=== Pool 0 ==="
cleos -u "$RPC" get table "$DEX" "$DEX" pools --lower 0 --upper 1

echo
echo "=== LIME issuer balance ==="
cleos -u "$RPC" get currency balance "$LIME_TOKEN" "$LIME_ISSUER" LIME

echo
echo "Bootstrap complete. Seed liquidity with:"
echo "  LP_ACCOUNT=$LIME_ISSUER bash scripts/seed-pool0.sh"
