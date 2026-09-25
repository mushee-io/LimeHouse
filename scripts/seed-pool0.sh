#!/usr/bin/env bash
set -euo pipefail

RPC="${ULTRA_TESTNET_RPC:-https://ultra-testnet.eosphere.io}"
CONTRACT="${LIMEB_ACCOUNT:-1aa2aa3aa4wr}"
LP_ACCOUNT="${LP_ACCOUNT:-}"
UOS_AMOUNT="${UOS_AMOUNT:-1.00000000 UOS}"
USDT_AMOUNT="${USDT_AMOUNT:-0.004300 USDT}"
MIN_SHARES="${MIN_SHARES:-1}"

if [[ -z "$LP_ACCOUNT" ]]; then
  echo "Set LP_ACCOUNT to a separate Ultra Testnet account that holds both UOS and USDT."
  echo "Example: LP_ACCOUNT=youraccount bash scripts/seed-pool0.sh"
  exit 1
fi

if [[ "$LP_ACCOUNT" == "$CONTRACT" ]]; then
  echo "LP_ACCOUNT must be different from the Lime B contract account."
  echo "The contract ignores its own outgoing transfers and cannot credit itself as an LP."
  exit 1
fi

if ! command -v cleos >/dev/null 2>&1; then
  echo "cleos is required. Run this inside Ultra's developer Docker image."
  exit 1
fi

echo "Lime B Pool 0 initial liquidity"
echo "  Contract: $CONTRACT"
echo "  LP:       $LP_ACCOUNT"
echo "  UOS:      $UOS_AMOUNT"
echo "  USDT:     $USDT_AMOUNT"
echo

echo "Checking LP balances..."
cleos -u "$RPC" get currency balance eosio.token "$LP_ACCOUNT" UOS
cleos -u "$RPC" get currency balance eosio.token "$LP_ACCOUNT" USDT

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
      \"account\": \"eosio.token\",
      \"name\": \"transfer\",
      \"authorization\": [{\"actor\": \"$LP_ACCOUNT\", \"permission\": \"active\"}],
      \"data\": {
        \"from\": \"$LP_ACCOUNT\",
        \"to\": \"$CONTRACT\",
        \"quantity\": \"$USDT_AMOUNT\",
        \"memo\": \"Lime B Pool 0 USDT seed\"
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
        \"max1\": \"$USDT_AMOUNT\",
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
