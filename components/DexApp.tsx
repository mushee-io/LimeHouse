"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LIMEB_CONTRACT, LIME_TOKEN_CONTRACT } from "@/lib/config";
import {
  assetToDisplay,
  decimalToUnits,
  fetchPool0,
  parseAsset,
  PoolRow,
  quotePool,
  unitsToAsset
} from "@/lib/ultraRpc";
import {
  connectUltraWallet,
  disconnectUltraWallet,
  signUltraTransaction
} from "@/lib/ultraWallet";

type Token = {
  symbol: string;
  name: string;
  accent: string;
  text: string;
  precision: number;
};

const TOKENS: Token[] = [
  { symbol: "UOS", name: "Ultra", accent: "#101114", text: "#ffffff", precision: 8 },
  { symbol: "LIME", name: "Lime B", accent: "#c9f03f", text: "#111314", precision: 6 }
];

function ChevronDown({ small = false }: { small?: boolean }) {
  return (
    <svg
      width={small ? "13" : "16"}
      height={small ? "13" : "16"}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M19.4 13.1a7.7 7.7 0 000-2.2l2-1.5-2-3.5-2.4 1a8.4 8.4 0 00-1.9-1.1L14.8 3h-4l-.4 2.8a8.4 8.4 0 00-1.9 1.1l-2.4-1-2 3.5 2 1.5a7.7 7.7 0 000 2.2l-2 1.5 2 3.5 2.4-1a8.4 8.4 0 001.9 1.1l.4 2.8h4l.4-2.8a8.4 8.4 0 001.9-1.1l2.4 1 2-3.5-2.1-1.5z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14m0 0l-5-5m5 5l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TokenBadge({ token }: { token: Token }) {
  return (
    <span
      className="token-badge"
      style={{ background: token.accent, color: token.text }}
      aria-hidden="true"
    >
      {token.symbol === "UOS" ? "U" : "L"}
    </span>
  );
}

function TokenPicker({
  value,
  onChange,
  exclude
}: {
  value: Token;
  onChange: (token: Token) => void;
  exclude?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="token-picker-wrap">
      <button className="token-picker" type="button" onClick={() => setOpen((v) => !v)}>
        <TokenBadge token={value} />
        <span>{value.symbol}</span>
        <ChevronDown small />
      </button>

      {open && (
        <div className="token-menu">
          {TOKENS.filter((token) => token.symbol !== exclude).map((token) => (
            <button
              type="button"
              className="token-option"
              key={token.symbol}
              onClick={() => {
                onChange(token);
                setOpen(false);
              }}
            >
              <TokenBadge token={token} />
              <span>
                <strong>{token.symbol}</strong>
                <small>{token.name}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function poolHasLiquidity(pool: PoolRow | null) {
  if (!pool) return false;

  try {
    return parseAsset(pool.reserve0).units > 0n && parseAsset(pool.reserve1).units > 0n;
  } catch {
    return false;
  }
}

export default function DexApp() {
  const [tab, setTab] = useState<"swap" | "pool">("swap");
  const [tokenIn, setTokenIn] = useState(TOKENS[0]);
  const [tokenOut, setTokenOut] = useState(TOKENS[1]);
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("");
  const [walletBusy, setWalletBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [slippage, setSlippage] = useState("0.5");
  const [pool0, setPool0] = useState<PoolRow | null>(null);
  const [poolLoading, setPoolLoading] = useState(true);
  const [poolError, setPoolError] = useState("");

  const refreshPool = useCallback(async () => {
    try {
      const pool = await fetchPool0();
      setPool0(pool);
      setPoolError("");
    } catch (error) {
      setPoolError(
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Could not read Lime B Pool 0 from Ultra Testnet."
      );
    } finally {
      setPoolLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPool();
    const timer = window.setInterval(() => void refreshPool(), 15000);
    return () => window.clearInterval(timer);
  }, [refreshPool]);

  const quote = useMemo(() => {
    if (!pool0 || !amount) return null;

    try {
      const reserve0 = parseAsset(pool0.reserve0);
      const reserve1 = parseAsset(pool0.reserve1);
      const inputReserve = reserve0.symbol === tokenIn.symbol ? reserve0 : reserve1;

      if (inputReserve.symbol !== tokenIn.symbol) return null;

      const inputUnits = decimalToUnits(amount, inputReserve.precision);
      if (inputUnits <= 0n) return null;

      return quotePool(pool0, tokenIn.symbol, inputUnits);
    } catch {
      return null;
    }
  }, [amount, pool0, tokenIn.symbol]);

  const estimate = useMemo(() => {
    if (!amount) return "";
    if (!pool0 || !poolHasLiquidity(pool0) || !quote || quote.output <= 0n) return "—";

    const value = unitsToAsset(
      quote.output,
      quote.outputAsset.precision,
      quote.outputAsset.symbol
    ).split(" ")[0];

    return Number(value).toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [amount, pool0, quote]);

  const shortAccount = account ? `${account.slice(0, 5)}…${account.slice(-4)}` : "";
  const live = Boolean(pool0);
  const liquid = poolHasLiquidity(pool0);

  const flip = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
  };

  async function handleWallet() {
    setNotice("");
    setWalletBusy(true);
    try {
      if (account) {
        await disconnectUltraWallet();
        setAccount("");
      } else {
        const data = await connectUltraWallet();
        setAccount(data.blockchainid);
      }
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Could not connect Ultra Wallet. Make sure the extension is installed and set to Ultra Testnet.";
      setNotice(message);
    } finally {
      setWalletBusy(false);
    }
  }

  async function handlePrimaryAction() {
    if (!account) {
      void handleWallet();
      return;
    }

    if (tab === "pool") {
      if (!pool0) {
        setNotice("Pool 0 is not on-chain yet. Run scripts/create-pool0.sh with the Lime B contract wallet unlocked.");
      } else if (!liquid) {
        setNotice("Pool 0 is live. Initial UOS + LIME liquidity is the next on-chain step.");
      } else {
        setNotice("Pool 0 is live and funded. Liquidity position management is being wired to this panel next.");
      }
      return;
    }

    if (!pool0) {
      setNotice("Pool 0 is not live on Ultra Testnet yet.");
      return;
    }

    if (!pool0.enabled) {
      setNotice("Pool 0 is currently paused.");
      return;
    }

    if (!liquid) {
      setNotice("Pool 0 exists but has no liquidity yet.");
      return;
    }

    if (!quote || quote.output <= 0n) {
      setNotice("Enter an amount that can be quoted against Pool 0.");
      return;
    }

    try {
      const inputUnits = decimalToUnits(amount, quote.inputAsset.precision);
      const amountIn = unitsToAsset(
        inputUnits,
        quote.inputAsset.precision,
        quote.inputAsset.symbol
      );

      const slippageBps = Math.max(
        0,
        Math.min(9999, Math.round(Number(slippage) * 100))
      );
      const minOutUnits =
        (quote.output * BigInt(10000 - slippageBps)) / 10000n;
      const minOut = unitsToAsset(
        minOutUnits,
        quote.outputAsset.precision,
        quote.outputAsset.symbol
      );

      setNotice("Approve the atomic Lime B swap in Ultra Wallet.");
      setWalletBusy(true);

      const response = await signUltraTransaction([
        {
          contract: quote.inputAsset.symbol === "UOS" ? "eosio.token" : LIME_TOKEN_CONTRACT,
          action: "transfer",
          data: {
            from: account,
            to: LIMEB_CONTRACT,
            quantity: amountIn,
            memo: "Lime B swap deposit"
          }
        },
        {
          contract: LIMEB_CONTRACT,
          action: "swap",
          data: {
            user: account,
            pool_id: Number(pool0.id),
            amount_in: amountIn,
            min_out: minOut
          }
        }
      ]);

      const data = response.data as { transactionHash?: string };
      setNotice(
        data.transactionHash
          ? `Swap executed on Ultra Testnet · ${data.transactionHash.slice(0, 12)}…`
          : "Swap executed on Ultra Testnet."
      );
      setAmount("");
      await refreshPool();
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : "The Ultra Wallet transaction was not completed.";
      setNotice(message);
    } finally {
      setWalletBusy(false);
    }
  }

  const poolPair = pool0
    ? `${parseAsset(pool0.reserve0).symbol} / ${parseAsset(pool0.reserve1).symbol}`
    : "UOS / LIME";

  return (
    <main className="app-shell">
      <div className="announcement">
        <span className="announcement-mark">B</span>
        <span>Lime B is building native liquidity for Ultra.</span>
        <span className={live ? "live-copy" : "pending-copy"}>
          {poolLoading ? "Reading Pool 0…" : live ? "Pool 0 live" : "Pool 0 awaiting bootstrap"}
        </span>
      </div>

      <header className="nav">
        <div className="nav-left">
          <a className="brand" href="#" aria-label="Lime B home">
            <span className="brand-mark">LB</span>
            <span>Lime B</span>
          </a>

          <nav className="desktop-links" aria-label="Main navigation">
            <button className={tab === "swap" ? "nav-link active" : "nav-link"} type="button" onClick={() => setTab("swap")}>
              Swap
            </button>
            <button className={tab === "pool" ? "nav-link active" : "nav-link"} type="button" onClick={() => setTab("pool")}>
              Pool
            </button>
            <button className="nav-link" type="button">
              Analytics
            </button>
            <button className="nav-link" type="button">
              More <ChevronDown small />
            </button>
          </nav>
        </div>

        <div className="nav-actions">
          <span className="network-pill">
            <span className="network-dot" />
            Ultra Testnet
          </span>
          <button className="wallet-top" type="button" onClick={handleWallet} disabled={walletBusy}>
            {walletBusy ? "Working…" : account ? shortAccount : "Connect wallet"}
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="dex-column">
          <h1>{tab === "swap" ? "Swap" : "Pool"}</h1>
          <p className="subhead">
            {tab === "swap"
              ? "Trade UOS and LIME through Lime B Pool 0 on Ultra."
              : "Pool 0 · UOS / LIME · 0.30% LP fee."}
          </p>

          <div className="card">
            <div className="card-top">
              <div className="segmented" role="tablist" aria-label="DEX view">
                <button
                  type="button"
                  className={tab === "swap" ? "segment active" : "segment"}
                  onClick={() => setTab("swap")}
                >
                  Swap
                </button>
                <button
                  type="button"
                  className={tab === "pool" ? "segment active" : "segment"}
                  onClick={() => setTab("pool")}
                >
                  Pool
                </button>
              </div>

              <div className="settings-wrap">
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Swap settings"
                  onClick={() => setSettingsOpen((v) => !v)}
                >
                  <SettingsIcon />
                </button>

                {settingsOpen && (
                  <div className="settings-popover">
                    <div className="settings-title">Transaction settings</div>
                    <label htmlFor="slippage">Slippage tolerance</label>
                    <div className="slippage-row">
                      {["0.1", "0.5", "1.0"].map((value) => (
                        <button
                          type="button"
                          className={slippage === value ? "slip active" : "slip"}
                          key={value}
                          onClick={() => setSlippage(value)}
                        >
                          {value}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {tab === "swap" ? (
              <>
                <div className="field-block">
                  <div className="field-label-row">
                    <span>You pay</span>
                    <span>{live ? poolPair : "Pool 0"}</span>
                  </div>
                  <div className="asset-row">
                    <TokenPicker
                      value={tokenIn}
                      exclude={tokenOut.symbol}
                      onChange={(token) => setTokenIn(token)}
                    />
                    <input
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
                      aria-label="Amount to swap"
                    />
                  </div>
                  <div className="field-foot">
                    <span>{liquid ? "Live on-chain quote" : "Awaiting liquidity"}</span>
                  </div>
                </div>

                <div className="switch-line">
                  <button className="switch-button" type="button" onClick={flip} aria-label="Switch assets">
                    <ArrowDownIcon />
                  </button>
                </div>

                <div className="field-block output">
                  <div className="field-label-row">
                    <span>You receive</span>
                    <span>{pool0?.enabled === false ? "Pool paused" : live ? "Pool 0" : "Not live"}</span>
                  </div>
                  <div className="asset-row">
                    <TokenPicker
                      value={tokenOut}
                      exclude={tokenIn.symbol}
                      onChange={(token) => setTokenOut(token)}
                    />
                    <div className={estimate && estimate !== "—" ? "estimate" : "estimate muted"}>
                      {estimate || "0.00"}
                    </div>
                  </div>
                  <div className="field-foot">
                    <span>{estimate && estimate !== "—" ? "Constant-product quote" : "$0.00"}</span>
                  </div>
                </div>

                <div className="route-summary">
                  <span>Pool fee · {(Number(pool0?.fee_bps ?? 30) / 100).toFixed(2)}%</span>
                  <strong>Max slippage · {slippage}%</strong>
                </div>

                <button
                  className="primary-action"
                  type="button"
                  onClick={handlePrimaryAction}
                  disabled={walletBusy}
                >
                  {!account
                    ? "Connect wallet"
                    : !live
                      ? "Pool 0 not live"
                      : !liquid
                        ? "Awaiting liquidity"
                        : "Review swap"}
                </button>
              </>
            ) : (
              <div className="pool-panel">
                <div className="pool-orb">0</div>
                <div className="pool-status-line">
                  <span className={live ? "pool-status-dot live" : "pool-status-dot"} />
                  {poolLoading ? "Reading Ultra Testnet" : live ? "Pool 0 live on-chain" : "Pool 0 not created yet"}
                </div>
                <h2>{poolPair}</h2>
                {pool0 ? (
                  <div className="pool-metrics">
                    <div>
                      <span>UOS reserve</span>
                      <strong>
                        {parseAsset(pool0.reserve0).symbol === "UOS"
                          ? assetToDisplay(pool0.reserve0)
                          : assetToDisplay(pool0.reserve1)}
                      </strong>
                    </div>
                    <div>
                      <span>LIME reserve</span>
                      <strong>
                        {parseAsset(pool0.reserve0).symbol === "LIME"
                          ? assetToDisplay(pool0.reserve0)
                          : assetToDisplay(pool0.reserve1)}
                      </strong>
                    </div>
                    <div>
                      <span>LP fee</span>
                      <strong>{(Number(pool0.fee_bps) / 100).toFixed(2)}%</strong>
                    </div>
                  </div>
                ) : (
                  <p>
                    Pool 0 is configured as UOS / LIME. The contract is deployed and ready for its first pool definition.
                  </p>
                )}
                <button className="primary-action" type="button" onClick={handlePrimaryAction}>
                  {!account ? "Connect wallet" : !live ? "Bootstrap Pool 0" : !liquid ? "Add initial liquidity" : "Manage liquidity"}
                </button>
              </div>
            )}

            {(notice || poolError) && <div className="notice">{notice || poolError}</div>}
          </div>

          <div className="powered">
            <span>Pool contract</span>
            <strong>{LIMEB_CONTRACT}</strong>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-inner">
          <div>
            <span className="eyebrow">Lime B Statistics</span>
            <h2>Protocol overview</h2>
          </div>

          <div className="stats-grid">
            <div className="stat">
              <span>Pool 0</span>
              <strong>{live ? poolPair : "Awaiting creation"}</strong>
            </div>
            <div className="stat">
              <span>Liquidity status</span>
              <strong>{liquid ? "Funded" : live ? "Needs liquidity" : "—"}</strong>
            </div>
            <div className="stat">
              <span>Network</span>
              <strong>Ultra Testnet</strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
