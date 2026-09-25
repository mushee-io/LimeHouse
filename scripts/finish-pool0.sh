#!/usr/bin/env bash
set -euo pipefail

RPC="${ULTRA_TESTNET_RPC:-https://ultra-testnet.eosphere.io}"
DEX="${LIMEB_ACCOUNT:-1aa2aa3aa4wr}"
LP="${LP_ACCOUNT:-1aa2aa3aa4ws}"
LIME_TOKEN="${LIME_TOKEN_CONTRACT:-1aa2aa3aa4ws}"
UOS_AMOUNT="${UOS_AMOUNT:-1.00000000 UOS}"
LIME_AMOUNT="${LIME_AMOUNT:-100.000000 LIME}"
MIN_SHARES="${MIN_SHARES:-1}"

echo "=== Lime B final Pool 0 setup ==="
echo "DEX: $DEX"
echo "LP:  $LP"
echo

echo "1/4 Compile RAM-payer hotfix..."
(
  cd contracts/limeb
  cdt-cpp -o limeb.wasm limeb.cpp
)

echo "2/4 Redeploy Lime B..."
cleos -u "$RPC" set contract "$DEX" contracts/limeb limeb.wasm limeb.abi -p "$DEX@active"

echo "3/4 Seed Pool 0 atomically..."
TX_OUTPUT="$(cleos -u "$RPC" push transaction "{
  \"actions\": [
    {
      \"account\": \"eosio.token\",
      \"name\": \"transfer\",
      \"authorization\": [{\"actor\": \"$LP\", \"permission\": \"active\"}],
      \"data\": {
        \"from\": \"$LP\",
        \"to\": \"$DEX\",
        \"quantity\": \"$UOS_AMOUNT\",
        \"memo\": \"Lime B Pool 0 UOS seed\"
      }
    },
    {
      \"account\": \"$LIME_TOKEN\",
      \"name\": \"transfer\",
      \"authorization\": [{\"actor\": \"$LP\", \"permission\": \"active\"}],
      \"data\": {
        \"from\": \"$LP\",
        \"to\": \"$DEX\",
        \"quantity\": \"$LIME_AMOUNT\",
        \"memo\": \"Lime B Pool 0 LIME seed\"
      }
    },
    {
      \"account\": \"$DEX\",
      \"name\": \"addliq\",
      \"authorization\": [{\"actor\": \"$LP\", \"permission\": \"active\"}],
      \"data\": {
        \"user\": \"$LP\",
        \"pool_id\": 0,
        \"max0\": \"$UOS_AMOUNT\",
        \"max1\": \"$LIME_AMOUNT\",
        \"min_shares\": $MIN_SHARES
      }
    }
  ]
}" 2>&1)"
printf '%s\n' "$TX_OUTPUT"

echo
echo "4/4 Verify Pool 0..."
sleep 2

POOL_JSON="$(cleos -u "$RPC" get table "$DEX" "$DEX" pools --lower 0 --upper 1)"
printf '%s\n' "$POOL_JSON"

printf '%s' "$POOL_JSON" | python3 -c '
import json, sys
d=json.load(sys.stdin)
rows=d.get("rows", [])
if not rows:
    raise SystemExit("Pool 0 missing")
p=rows[0]
r0=float(str(p["reserve0"]).split()[0])
r1=float(str(p["reserve1"]).split()[0])
shares=int(p["total_shares"])
if r0 <= 0 or r1 <= 0 or shares <= 0:
    raise SystemExit("Pool 0 is still empty")
print("SUCCESS: Pool 0 funded with {} + {} | shares={}".format(p["reserve0"], p["reserve1"], shares))
'

echo
echo "LP position:"
cleos -u "$RPC" get table "$DEX" "$DEX" positions --limit 100

echo
echo "Remaining LP balances:"
cleos -u "$RPC" get currency balance eosio.token "$LP" UOS
cleos -u "$RPC" get currency balance "$LIME_TOKEN" "$LP" LIME

echo
echo "LIME B Pool 0 is live."
