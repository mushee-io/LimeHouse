#!/usr/bin/env bash
set -euo pipefail

RPC="${ULTRA_TESTNET_RPC:-https://ultra-testnet.eosphere.io}"
CONTRACT="${LIMEB_ACCOUNT:-1aa2aa3aa4wr}"
LP_ACCOUNT="${LP_ACCOUNT:-1aa2aa3aa4ws}"
LIME_TOKEN_CONTRACT="${LIME_TOKEN_CONTRACT:-1aa2aa3aa4ws}"
UOS_AMOUNT="${UOS_AMOUNT:-1.00000000 UOS}"
LIME_AMOUNT="${LIME_AMOUNT:-100.000000 LIME}"
MIN_SHARES="${MIN_SHARES:-1}"

if [[ "$LP_ACCOUNT" == "$CONTRACT" ]]; then
  echo "LP_ACCOUNT must be different from the Lime B contract account."
  exit 1
fi

if ! command -v cleos >/dev/null 2>&1; then
  echo "cleos is required. Run this inside Ultra's developer Docker image."
  exit 1
fi

echo "Lime B Pool 0 initial liquidity"
echo "  Contract:   $CONTRACT"
echo "  LP:         $LP_ACCOUNT"
echo "  Pair:       UOS / LIME"
echo "  UOS:        $UOS_AMOUNT"
echo "  LIME:       $LIME_AMOUNT"
echo

echo "Checking LP balances..."
cleos -u "$RPC" get currency balance eosio.token "$LP_ACCOUNT" UOS
cleos -u "$RPC" get currency balance "$LIME_TOKEN_CONTRACT" "$LP_ACCOUNT" LIME

echo
echo "Submitting atomic deposit + addliq transaction..."
cleos -u "$RPC" push transaction "{
  \"actions\": [
    {
      \"account\": \"eosio.token\",
      \"name\": \"transfer\",
      \"authorization\": [{\"actor\": \"$LP_ACCOUNT\", \"permission\": \"active\"}],
      \"data\": {
        \"from\": \"$LP_ACCOUNT\",
        \"to\": \"$CONTRACT\",
        \"quantity\": \"$UOS_AMOUNT\",
        \"memo\": \"Lime B Pool 0 UOS seed\"
      }
    },
    {
      \"account\": \"$LIME_TOKEN_CONTRACT\",
      \"name\": \"transfer\",
      \"authorization\": [{\"actor\": \"$LP_ACCOUNT\", \"permission\": \"active\"}],
      \"data\": {
        \"from\": \"$LP_ACCOUNT\",
        \"to\": \"$CONTRACT\",
        \"quantity\": \"$LIME_AMOUNT\",
        \"memo\": \"Lime B Pool 0 LIME seed\"
      }
    },
    {
      \"account\": \"$CONTRACT\",
      \"name\": \"addliq\",
      \"authorization\": [{\"actor\": \"$LP_ACCOUNT\", \"permission\": \"active\"}],
      \"data\": {
        \"user\": \"$LP_ACCOUNT\",
        \"pool_id\": 0,
        \"max0\": \"$UOS_AMOUNT\",
        \"max1\": \"$LIME_AMOUNT\",
        \"min_shares\": $MIN_SHARES
      }
    }
  ]
}"

echo
echo "Pool 0 after seeding:"
cleos -u "$RPC" get table "$CONTRACT" "$CONTRACT" pools --lower 0 --upper 1

echo
echo "LP position:"
cleos -u "$RPC" get table "$CONTRACT" "$CONTRACT" positions --limit 100
