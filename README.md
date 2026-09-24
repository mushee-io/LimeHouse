# Lime B

Lime B is an Ultra-native decentralized exchange project.

This repository currently contains the first production-quality application shell for the DEX: a minimalist swap/pool interface, Ultra Testnet wallet connection, token selection, swap preview, slippage controls, and protocol-status UI.

## Current status

- Tinyman-inspired information architecture, rebuilt as an original Lime B interface
- Ultra Testnet target
- Ultra Wallet Extension integration via `@ultraos/wallet-sdk`
- Swap and Pool views
- Interactive asset selectors
- Slippage settings
- Indicative quote UI
- Responsive mobile layout
- On-chain swap execution intentionally gated until the Lime B AMM contract is deployed

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Ultra Testnet

The app is configured for Ultra Testnet. The Ultra Web Wallet currently serves mainnet; Testnet development therefore uses the Ultra Wallet browser extension.

Default public RPC:

```text
https://ultra-testnet.eosphere.io
```

## Environment

```bash
NEXT_PUBLIC_ULTRA_ENV=testnet
NEXT_PUBLIC_ULTRA_RPC=https://ultra-testnet.eosphere.io
NEXT_PUBLIC_LIMEB_CONTRACT=
```

Set `NEXT_PUBLIC_LIMEB_CONTRACT` only after the AMM contract is deployed. The app does not fake swap execution.

## Next protocol milestones

1. Implement Lime B constant-product pool contract for Ultra.
2. Add pool creation and LP accounting.
3. Deploy the contract on Ultra Testnet.
4. Wire deposits + swaps into Ultra Wallet transaction signing.
5. Read balances, reserves, quotes and LP positions from chain tables.
6. Add transaction confirmation and explorer links.
7. Add indexer-backed volume / TVL analytics.
8. Harden math, slippage checks and contract permissions before mainnet.

## Brand

**Lime B** — native liquidity for Ultra.
