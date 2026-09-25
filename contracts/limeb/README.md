# Lime B AMM contract

This is the on-chain liquidity engine for Lime B on Ultra.

## Current Ultra Testnet deployment

- Contract account: `1aa2aa3aa4wr`
- Network: Ultra Testnet
- Pool 0 pair: `8,UOS / 6,USDT`
- Pool fee: `30` bps (0.30%)
- Token contract: `eosio.token`

Both UOS and USDT have been verified on Ultra Testnet's `eosio.token` contract. USDC and LIME are not currently defined there, so Lime B does not advertise those pairs as live pools.

## What it does

- receives fungible-token deposits through `eosio.token::transfer`
- keeps per-user uncommitted token credits
- creates permissioned pool definitions
- mints internal LP shares
- adds proportional liquidity
- removes liquidity with minimum-output checks
- performs x*y=k swaps
- charges a configurable LP fee in basis points
- protects swaps with `min_out`
- lets users withdraw unused deposits
- lets the contract administrator pause a pool or change its fee

## Atomic user flow

Ultra Wallet supports multiple actions in one transaction. A swap is:

1. `eosio.token::transfer` from the user to the Lime B contract
2. `limeb::swap` using that credited amount

If either action fails, the entire transaction reverts.

Adding liquidity is the same pattern:

1. transfer token 0
2. transfer token 1
3. call `addliq`

## Compile

Ultra's official developer image includes `cdt-cpp`.

```bash
docker pull quay.io/ultra.io/3rdparty-devtools:latest

docker run --rm \
  -v "$PWD:/opt/ultra_workdir/LimeHouse" \
  quay.io/ultra.io/3rdparty-devtools:latest \
  bash -lc 'cd /opt/ultra_workdir/LimeHouse/contracts/limeb && cdt-cpp -o limeb.wasm limeb.cpp'
```

This produces:

- `limeb.wasm`
- `limeb.abi`

## Deploy to Ultra Testnet

Deploy the generated WASM + ABI to the contract account using the Ultra Smart Contract VS Code extension or `cleos`.

The contract account needs `eosio.code` on its active authority so inline `eosio.token::transfer` payouts can execute:

```bash
cleos -u https://ultra-testnet.eosphere.io \
  set account permission 1aa2aa3aa4wr active --add-code \
  -p 1aa2aa3aa4wr@owner
```

The currently deployed account already has this permission.

## Create Pool 0

From the repository, with the contract key loaded in an unlocked local cleos wallet:

```bash
bash scripts/create-pool0.sh
```

That script validates both Testnet token definitions and submits:

```bash
cleos -u https://ultra-testnet.eosphere.io \
  push action 1aa2aa3aa4wr createpool \
  '["8,UOS","6,USDT",30]' \
  -p 1aa2aa3aa4wr@active
```

It then reads the `pools` table back from chain.

## Initial liquidity

After Pool 0 exists, the initial LP must transfer both assets to the contract and call `addliq` in the same transaction or as deposits followed by `addliq`.

The contract will not invent test balances. The LP account must actually hold both UOS and USDT on `eosio.token`.

## Swap action example

Assume Pool 0 has liquidity and the user has deposited 1 UOS:

```bash
cleos -u https://ultra-testnet.eosphere.io push action 1aa2aa3aa4wr swap \
  '["useraccount",0,"1.00000000 UOS","0.000001 USDT"]' \
  -p useraccount@active
```

The web app now constructs the transfer + swap atomically through the Ultra Wallet SDK and calculates the quote from the live Pool 0 reserves.

## Security model

- pool creation, fee changes and pool enable/disable require contract-account authorization
- swaps and LP actions require the user's authorization
- user deposits are segregated in the `credits` table until consumed
- direct outgoing transfers from the contract are ignored by the deposit listener
- swap arithmetic uses 128-bit intermediates
- output reserve cannot be fully drained by one swap
- slippage checks are enforced on-chain

This contract is Testnet software. It should be independently audited before any Mainnet deployment or use with material value.
