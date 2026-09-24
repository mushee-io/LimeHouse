# Lime B AMM contract

This is the on-chain liquidity engine for Lime B on Ultra.

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

Ultra Wallet supports multiple actions in one transaction. A swap is therefore:

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

This should produce:

- `limeb.wasm`
- `limeb.abi`

## Deploy to Ultra Testnet

Deploy the generated WASM + ABI to a funded Ultra developer Testnet account using the Ultra Smart Contract VS Code extension or `cleos`.

After deployment, allow the contract code to send inline transfers:

```bash
cleos -u <ULTRA_TESTNET_RPC> set account permission <CONTRACT_ACCOUNT> active --add-code
```

Then create the first pool. Example for a UOS token with 8 decimals and a hypothetical 6-decimal USDC token:

```bash
cleos -u <ULTRA_TESTNET_RPC> push action <CONTRACT_ACCOUNT> createpool '["8,UOS","6,USDC",30]' -p <CONTRACT_ACCOUNT>@active
```

Do not reuse the example USDC precision unless it matches the actual Ultra Testnet token you intend to list.

## Swap action example

Assume pool 0 is UOS/USDC and the user has deposited 1 UOS:

```bash
cleos -u <ULTRA_TESTNET_RPC> push action <CONTRACT_ACCOUNT> swap \
  '["useraccount",0,"1.00000000 UOS","0.000001 USDC"]' \
  -p useraccount@active
```

In the web app this call is paired atomically with the preceding token transfer.

## Security model

- pool creation, fee changes and pool enable/disable require contract-account authorization
- swaps and LP actions require the user's authorization
- user deposits are segregated in the `credits` table until consumed
- direct outgoing transfers from the contract are ignored by the deposit listener
- swap arithmetic uses 128-bit intermediates
- output reserve cannot be fully drained by one swap
- slippage checks are enforced on-chain

This contract is Testnet software. It should be independently audited before any Mainnet deployment or use with material value.
