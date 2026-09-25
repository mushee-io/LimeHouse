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
  precision: number;
  tone: "dark" | "lime";
};

const TOKENS: Token[] = [
  { symbol: "UOS", name: "Ultra", precision: 8, tone: "dark" },
  { symbol: "LIME", name: "Lime B", precision: 6, tone: "lime" }
];

function ChevronDown() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7h11l-3-3m3 3-3 3M17 17H6l3 3m-3-3 3-3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 4 8 4-8 4-8-4 8-4Zm-8 9 8 4 8-4M4 17l8 4 8-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 20V11m7 9V4m7 16v-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LimeLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "lime-logo compact" : "lime-logo"} aria-hidden="true">
      <span className="lime-segment one" />
      <span className="lime-segment two" />
      <span className="lime-segment three" />
    </span>
  );
}

function TokenBadge({ token }: { token: Token }) {
  return (
    <span className={`token-badge ${token.tone}`} aria-hidden="true">
      {token.symbol === "UOS" ? "U" : <LimeLogo compact />}
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
        <ChevronDown />
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

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function DexApp() {
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

  const live = Boolean(pool0);
  const liquid = poolHasLiquidity(pool0);

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
    if (!pool0 || !liquid || !quote || quote.output <= 0n) return "—";

    const value = unitsToAsset(
      quote.output,
      quote.outputAsset.precision,
      quote.outputAsset.symbol
    ).split(" ")[0];

    return Number(value).toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [amount, liquid, pool0, quote]);

  const poolData = useMemo(() => {
    if (!pool0) {
      return {
        pair: "UOS / LIME",
        reserveUos: "—",
        reserveLime: "—",
        totalShares: "—",
        fee: "0.30%",
        ratio: "—"
      };
    }

    try {
      const r0 = parseAsset(pool0.reserve0);
      const r1 = parseAsset(pool0.reserve1);
      const uos = r0.symbol === "UOS" ? r0 : r1;
      const lime = r0.symbol === "LIME" ? r0 : r1;
      const uosValue = Number(uos.units) / 10 ** uos.precision;
      const limeValue = Number(lime.units) / 10 ** lime.precision;
      const ratio = uosValue > 0 ? limeValue / uosValue : 0;

      return {
        pair: `${r0.symbol} / ${r1.symbol}`,
        reserveUos: assetToDisplay(uos.raw, 8),
        reserveLime: assetToDisplay(lime.raw, 6),
        totalShares: Number(pool0.total_shares).toLocaleString(),
        fee: `${(Number(pool0.fee_bps) / 100).toFixed(2)}%`,
        ratio: ratio > 0 ? `1 UOS = ${ratio.toLocaleString(undefined, { maximumFractionDigits: 4 })} LIME` : "—"
      };
    } catch {
      return {
        pair: "UOS / LIME",
        reserveUos: "—",
        reserveLime: "—",
        totalShares: "—",
        fee: "0.30%",
        ratio: "—"
      };
    }
  }, [pool0]);

  const shortAccount = account ? `${account.slice(0, 5)}…${account.slice(-4)}` : "";

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
      setNotice(
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Could not connect Ultra Wallet. Make sure the extension is installed and set to Ultra Testnet."
      );
    } finally {
      setWalletBusy(false);
    }
  }

  async function handleSwap() {
    if (!account) {
      await handleWallet();
      return;
    }

    if (!pool0 || !pool0.enabled || !liquid) {
      setNotice("Pool 0 is not available for trading yet.");
      return;
    }

    if (!quote || quote.output <= 0n) {
      setNotice("Enter an amount that can be quoted against Pool 0.");
      return;
    }

    try {
      const inputUnits = decimalToUnits(amount, quote.inputAsset.precision);
      const amountIn = unitsToAsset(inputUnits, quote.inputAsset.precision, quote.inputAsset.symbol);
      const slippageBps = Math.max(0, Math.min(9999, Math.round(Number(slippage) * 100)));
      const minOutUnits = (quote.output * BigInt(10000 - slippageBps)) / 10000n;
      const minOut = unitsToAsset(minOutUnits, quote.outputAsset.precision, quote.outputAsset.symbol);

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
      setNotice(
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : "The Ultra Wallet transaction was not completed."
      );
    } finally {
      setWalletBusy(false);
    }
  }

  return (
    <main className="site-shell">
      <div className="topline">
        <div className="topline-track">
          <span>LIME B IS LIVE ON ULTRA</span>
          <span className="topline-dash" />
          <span>OPEN LIQUIDITY</span>
          <span className="topline-dash" />
          <span>PERMISSIONLESS MARKETS</span>
          <span className="topline-dash" />
          <span>BUILT FOR ULTRA</span>
        </div>
      </div>

      <header className="site-nav">
        <button className="wordmark" type="button" onClick={() => scrollToId("home")} aria-label="Lime B home">
          <LimeLogo />
          <span>Lime B</span>
        </button>

        <nav className="site-links" aria-label="Primary navigation">
          <button type="button" onClick={() => scrollToId("trade")}>Trade</button>
          <button type="button" onClick={() => scrollToId("pools")}>Pools</button>
          <button type="button" onClick={() => scrollToId("liquidity")}>Liquidity</button>
          <button type="button" onClick={() => scrollToId("roadmap")}>Roadmap</button>
          <button type="button" onClick={() => scrollToId("footer")}>Learn</button>
        </nav>

        <div className="nav-actions">
          <span className="network-label"><i /> Ultra Testnet</span>
          <button className="connect-button small" type="button" onClick={handleWallet} disabled={walletBusy}>
            {walletBusy ? "Working…" : account ? shortAccount : "Connect wallet"}
            <ArrowIcon />
          </button>
        </div>
      </header>

      <section className="editorial-hero" id="home">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="micro-kicker">Decentralized finance for a brighter tomorrow</span>
            <h1>
              THE EXCHANGE
              <br />
              FOR THE ULTRA
              <br />
              ECONOMY
            </h1>
            <p>
              Lime B is a decentralized trading protocol on Ultra — open, liquid and
              permissionless markets designed for everyone.
            </p>
            <div className="hero-actions">
              <button type="button" className="cta lime" onClick={() => scrollToId("trade")}>
                Start trading <ArrowIcon />
              </button>
              <button type="button" className="cta outline" onClick={() => scrollToId("pools")}>
                Explore pools
              </button>
            </div>

            <div className="hero-live-stats">
              <div>
                <strong>{poolLoading ? "…" : live ? "LIVE" : "OFFLINE"}</strong>
                <span>Pool 0 status</span>
              </div>
              <div>
                <strong>{poolData.reserveUos}</strong>
                <span>UOS reserve</span>
              </div>
              <div>
                <strong>{poolData.reserveLime}</strong>
                <span>LIME reserve</span>
              </div>
            </div>
          </div>

          <div className="hero-stage">
            <div className="hero-ribbon ribbon-a" />
            <div className="hero-ribbon ribbon-b" />
            <div className="machine">
              <div className="machine-base" />
              <div className="machine-ring ring-one" />
              <div className="machine-ring ring-two" />
              <div className="pipe pipe-left" />
              <div className="pipe pipe-right" />
              <div className="lime-fruit">
                <span className="lime-core" />
              </div>
            </div>

            <div className="hero-aside">
              TRADE
              <br />
              PROVIDE
              <br />
              EARN
              <br />
              BUILD
              <br />
              ON ULTRA
            </div>

            <section className="swap-card hero-swap" id="trade">
              <div className="swap-card-head">
                <div>
                  <strong>Swap</strong>
                  <span>Pool 0 · Ultra Testnet</span>
                </div>
                <button
                  type="button"
                  className="gear"
                  onClick={() => setSettingsOpen((v) => !v)}
                  aria-label="Swap settings"
                >
                  ⚙
                </button>
              </div>

              {settingsOpen && (
                <div className="settings-inline">
                  <span>Slippage</span>
                  <div>
                    {["0.1", "0.5", "1.0"].map((value) => (
                      <button
                        type="button"
                        key={value}
                        className={slippage === value ? "active" : ""}
                        onClick={() => setSlippage(value)}
                      >
                        {value}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="swap-field">
                <div className="swap-label-row">
                  <span>From</span>
                  <span>{account ? shortAccount : "Balance —"}</span>
                </div>
                <div className="swap-input-row">
                  <TokenPicker value={tokenIn} exclude={tokenOut.symbol} onChange={setTokenIn} />
                  <input
                    inputMode="decimal"
                    aria-label="Amount to swap"
                    placeholder="0.00"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
                  />
                </div>
              </div>

              <button type="button" className="flip-button" onClick={flip} aria-label="Switch assets">
                <SwapIcon />
              </button>

              <div className="swap-field">
                <div className="swap-label-row">
                  <span>To</span>
                  <span>{liquid ? "Live quote" : "No liquidity"}</span>
                </div>
                <div className="swap-input-row">
                  <TokenPicker value={tokenOut} exclude={tokenIn.symbol} onChange={setTokenOut} />
                  <div className={estimate && estimate !== "—" ? "swap-estimate" : "swap-estimate muted"}>
                    {estimate || "0.00"}
                  </div>
                </div>
              </div>

              <button className="connect-button swap-action" type="button" onClick={handleSwap} disabled={walletBusy}>
                {!account ? "Connect wallet" : liquid ? "Review swap" : "Pool unavailable"}
              </button>

              <div className="swap-meta">
                <span>{poolData.ratio}</span>
                <span>{poolData.fee} fee</span>
                <span>{slippage}% slippage</span>
              </div>

              {(notice || poolError) && <div className="notice">{notice || poolError}</div>}
            </section>
          </div>
        </div>
      </section>

      <section className="statement-section" id="liquidity">
        <div className="section-kicker"><span /> Built on Ultra</div>
        <div className="statement-grid">
          <div>
            <h2>LIQUIDITY<br />WITHOUT LIMITS</h2>
            <p>
              Lime B combines simple trading, transparent on-chain liquidity and a
              protocol-first experience built specifically for Ultra.
            </p>
          </div>

          <div className="editorial-cards">
            <article className="editorial-card acid">
              <SwapIcon />
              <h3>Swap</h3>
              <p>Trade Ultra assets against live on-chain reserves with clear execution details.</p>
              <ArrowIcon />
            </article>
            <article className="editorial-card">
              <StackIcon />
              <h3>Provide liquidity</h3>
              <p>Power Lime B markets with pooled capital and transparent LP accounting.</p>
              <ArrowIcon />
            </article>
            <article className="editorial-card">
              <ChartIcon />
              <h3>Explore protocol</h3>
              <p>Inspect reserves, fees, positions and protocol state directly from Ultra.</p>
              <ArrowIcon />
            </article>
          </div>
        </div>
      </section>

      <section className="protocol-section">
        <div className="protocol-art">
          <div className="protocol-orb">
            <div className="lime-fruit small">
              <span className="lime-core" />
            </div>
            <div className="pedestal p1" />
            <div className="pedestal p2" />
            <div className="pedestal p3" />
          </div>
          <span className="protocol-art-copy">OPEN<br />LIQUID<br />PERMISSIONLESS<br />BUILT FOR ULTRA</span>
        </div>

        <div className="protocol-stats">
          <div className="section-kicker"><span /> Protocol stats</div>
          <div className="protocol-stat-grid">
            <article>
              <strong>{poolData.reserveUos}</strong>
              <span>UOS in Pool 0</span>
              <i className="spark lime" />
            </article>
            <article>
              <strong>{poolData.reserveLime}</strong>
              <span>LIME in Pool 0</span>
              <i className="spark violet" />
            </article>
            <article>
              <strong>{poolData.totalShares}</strong>
              <span>Total LP shares</span>
              <i className="spark cyan" />
            </article>
            <article>
              <strong>{poolData.fee}</strong>
              <span>Pool fee</span>
              <i className="spark yellow" />
            </article>
          </div>
        </div>
      </section>

      <section className="pools-section" id="pools">
        <div className="pools-head">
          <div>
            <div className="section-kicker"><span /> Liquidity markets on Ultra</div>
            <h2>LIME B POOLS</h2>
          </div>
          <p>
            Live pool state is read directly from Lime B on Ultra Testnet. No fabricated volume,
            TVL or market data.
          </p>
        </div>

        <div className="pool-toolbar">
          <div className="pool-tabs">
            <button type="button" className="active">Overview</button>
            <button type="button">Assets</button>
            <button type="button">Pools</button>
            <button type="button">Transactions</button>
          </div>
          <span className={liquid ? "status-badge live" : "status-badge"}>{liquid ? "Pool 0 funded" : "Awaiting liquidity"}</span>
        </div>

        <div className="pool-table-wrap">
          <div className="pool-table-head">
            <span>Pair</span>
            <span>Reserve 0</span>
            <span>Reserve 1</span>
            <span>LP shares</span>
            <span>Fee</span>
          </div>
          <div className="pool-row">
            <div className="pair-cell">
              <TokenBadge token={TOKENS[0]} />
              <TokenBadge token={TOKENS[1]} />
              <div>
                <strong>{poolData.pair}</strong>
                <span>Ultra · Lime B</span>
              </div>
            </div>
            <strong>{poolData.reserveUos} UOS</strong>
            <strong>{poolData.reserveLime} LIME</strong>
            <strong>{poolData.totalShares}</strong>
            <strong>{poolData.fee}</strong>
          </div>
        </div>

        <div className="pool-foot">
          <span>Contract</span>
          <code>{LIMEB_CONTRACT}</code>
          <span>Network</span>
          <strong>Ultra Testnet</strong>
        </div>
      </section>

      <section className="roadmap-section" id="roadmap">
        <div className="roadmap-intro">
          <div className="section-kicker"><span /> Roadmap</div>
          <h2>A BRIGHTER<br />ULTRA TOGETHER</h2>
          <p>
            Lime B is moving from a functioning Testnet AMM toward a broader Ultra liquidity layer.
          </p>
        </div>

        <div className="roadmap-grid">
          <article>
            <i />
            <span>NOW</span>
            <h3>Pool 0 live</h3>
            <p>UOS / LIME AMM, on-chain reserves, swap quoting and Ultra Wallet flow.</p>
          </article>
          <article>
            <i />
            <span>NEXT</span>
            <h3>Liquidity UX</h3>
            <p>LP deposit and withdrawal surfaces, position detail and pool creation flows.</p>
          </article>
          <article>
            <i />
            <span>THEN</span>
            <h3>Protocol analytics</h3>
            <p>Indexed swaps, fees, volume, account activity and historical pool state.</p>
          </article>
          <article>
            <i />
            <span>LATER</span>
            <h3>Ultra ecosystem</h3>
            <p>More assets, permissionless markets, routing and ecosystem integrations.</p>
          </article>
        </div>
      </section>

      <footer className="site-footer" id="footer">
        <div className="footer-brand">
          <div className="wordmark light">
            <LimeLogo />
            <span>Lime B</span>
          </div>
          <p>The exchange for the Ultra economy.<br />Open markets. Real liquidity.</p>
        </div>

        <div className="footer-links">
          <div>
            <strong>Product</strong>
            <button type="button" onClick={() => scrollToId("trade")}>Trade</button>
            <button type="button" onClick={() => scrollToId("pools")}>Pools</button>
            <button type="button" onClick={() => scrollToId("liquidity")}>Liquidity</button>
          </div>
          <div>
            <strong>Protocol</strong>
            <span>Ultra Testnet</span>
            <span>Pool 0</span>
            <span>0.30% fee</span>
          </div>
          <div>
            <strong>Build</strong>
            <span>Smart contracts</span>
            <span>Ultra Wallet</span>
            <span>On-chain data</span>
          </div>
        </div>

        <div className="footer-note">
          <span>© 2026 Lime B. Built on Ultra.</span>
          <code>{LIMEB_CONTRACT}</code>
        </div>
      </footer>
    </main>
  );
}
