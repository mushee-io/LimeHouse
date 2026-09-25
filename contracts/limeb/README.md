# Lime B AMM contract

Lime B is an Ultra Testnet constant-product AMM.

## Current Testnet architecture

- DEX contract: `1aa2aa3aa4wr`
- LIME test-token contract + initial LP account: `1aa2aa3aa4ws`
- Network: Ultra Testnet
- Pool 0 target pair: `8,UOS / 6,LIME`
- Pool fee: 30 bps (0.30%)
- UOS contract: `eosio.token`
- LIME contract: `1aa2aa3aa4ws`

The original UOS/USDT Pool 0 was created successfully but remained empty. Ultra Testnet currently exposes no usable `ultra.swap` symbol rows for obtaining test USDT, so Lime B uses a standalone LIME test token instead.

## Token registry

Lime B no longer assumes every asset lives on `eosio.token`.

The `tokens` table registers one token contract per symbol:

- UOS -> `eosio.token`
- LIME -> `1aa2aa3aa4ws`

Incoming `*::transfer` notifications are accepted only when the transfer comes from the registered contract for that exact symbol + precision. Outgoing swaps and liquidity withdrawals are sent through the same registered contract.

## AMM actions

- `regtoken(token_contract, token_symbol, enabled)`
- `erasepool(pool_id)` — admin only; only an entirely empty pool can be erased
- `createpool(token0, token1, fee_bps)`
- `setenabled(pool_id, enabled)`
- `setfee(pool_id, fee_bps)`
- `addliq(user, pool_id, max0, max1, min_shares)`
- `removeliq(user, pool_id, shares, min0, min1)`
- `swap(user, pool_id, amount_in, min_out)`
- `withdraw(user, quantity)`

## One-command UOS/LIME bootstrap

Run inside Ultra's `3rdparty-devtools` container with both account keys already imported into the unlocked `cleos` wallet:

```bash
git pull
bash scripts/bootstrap-uos-lime.sh
```

The script:

1. compiles the upgraded Lime B AMM;
2. compiles the standalone LIME test-token contract;
3. redeploys Lime B to `1aa2aa3aa4wr`;
4. deploys the LIME token contract to `1aa2aa3aa4ws`;
5. creates a 1,000,000 LIME max supply if needed;
6. issues 10,000 LIME to `1aa2aa3aa4ws`;
7. registers UOS and LIME with Lime B;
8. safely deletes the empty legacy UOS/USDT Pool 0;
9. recreates Pool 0 as UOS/LIME.

It refuses to erase a funded pool.

## Seed Pool 0

After bootstrap:

```bash
LP_ACCOUNT=1aa2aa3aa4ws bash scripts/seed-pool0.sh
```

Default initial liquidity:

- `1.00000000 UOS`
- `100.000000 LIME`

The seed transaction is atomic:

1. UOS transfer from `eosio.token`;
2. LIME transfer from `1aa2aa3aa4ws`;
3. `limeb::addliq`.

If any action fails, the complete transaction reverts.

## Swap flow

The web app reads Pool 0 reserves directly from Ultra Testnet and constructs an atomic two-action swap:

1. transfer the input asset to Lime B using its registered token contract;
2. call `limeb::swap`.

The frontend calculates the same constant-product quote using integer math and sends a slippage-protected `min_out`.

## Permissions

The Lime B contract account already has:

```text
1aa2aa3aa4wr@eosio.code
```

inside its `active` authority, allowing inline token payouts.

## Security notes

- only the DEX account can register tokens, create/erase pools, pause pools or change fees;
- `erasepool` refuses to touch a pool with reserves or LP shares;
- a registered symbol is tied to a specific token contract and precision;
- deposits from spoofed token contracts are rejected;
- swaps and LP actions require the user's authorization;
- user deposits are segregated in the `credits` table until consumed;
- swap arithmetic uses 128-bit intermediates;
- slippage checks are enforced on-chain;
- one swap cannot drain the complete output reserve.

This is Testnet software and should be independently audited before Mainnet use.
