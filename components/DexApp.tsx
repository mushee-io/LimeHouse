"use client";

import { useMemo, useState } from "react";
import { connectUltraWallet, disconnectUltraWallet } from "@/lib/ultraWallet";

type Token = {
  symbol: string;
  name: string;
  accent: string;
  text: string;
};

const TOKENS: Token[] = [
  { symbol: "UOS", name: "Ultra", accent: "#101114", text: "#ffffff" },
  { symbol: "USDC", name: "USD Coin", accent: "#2775ca", text: "#ffffff" },
  { symbol: "USDT", name: "Tether USD", accent: "#26a17b", text: "#ffffff" },
  { symbol: "LIME", name: "Lime B", accent: "#cbf43f", text: "#111314" }
];

const DEMO_RATES: Record<string, number> = {
  "UOS-USDC": 0.071,
  "USDC-UOS": 14.0845,
  "UOS-USDT": 0.071,
  "USDT-UOS": 14.0845,
  "LIME-UOS": 0.24,
  "UOS-LIME": 4.1667
};

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
      {token.symbol === "UOS" ? "U" : token.symbol.slice(0, 1)}
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

  const estimate = useMemo(() => {
    const numeric = Number(amount);
    if (!numeric || numeric <= 0) return "";
    const rate = DEMO_RATES[`${tokenIn.symbol}-${tokenOut.symbol}`];
    if (!rate) return "—";
    return (numeric * rate).toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [amount, tokenIn.symbol, tokenOut.symbol]);

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
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Could not connect Ultra Wallet. Make sure the extension is installed and set to Ultra Testnet.";
      setNotice(message);
    } finally {
      setWalletBusy(false);
    }
  }

  function handlePrimaryAction() {
    if (!account) {
      void handleWallet();
      return;
    }

    const contract = process.env.NEXT_PUBLIC_LIMEB_CONTRACT;
    if (!contract) {
      setNotice("Wallet connected. Lime B AMM execution will unlock after the pool contract is deployed and NEXT_PUBLIC_LIMEB_CONTRACT is configured.");
      return;
    }

    setNotice("Pool contract detected. Transaction construction is the next protocol integration step.");
  }

  return (
    <main className="app-shell">
      <div className="announcement">
        <span className="announcement-mark">B</span>
        <span>Lime B is building native liquidity for Ultra.</span>
        <a href="https://developers.ultra.io/" target="_blank" rel="noreferrer">
          Ultra docs <span aria-hidden="true">↗</span>
        </a>
      </div>

      <header className="nav">
        <div className="nav-left">
          <a className="brand" href="#" aria-label="Lime B home">
            <span className="brand-mark">LB</span>
            <span>Lime B</span>
          </a>

          <nav className="desktop-links" aria-label="Main navigation">
            <button className="nav-link active" type="button" onClick={() => setTab("swap")}>
              Swap
            </button>
            <button className="nav-link" type="button" onClick={() => setTab("pool")}>
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
            {walletBusy ? "Opening…" : account ? shortAccount : "Connect wallet"}
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="dex-column">
          <h1>{tab === "swap" ? "Swap" : "Pool"}</h1>
          <p className="subhead">
            {tab === "swap"
              ? "Trade assets on Ultra with Lime B liquidity."
              : "Provide liquidity and earn a share of pool fees."}
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
                    <span>Balance: {account ? "—" : "0"}</span>
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
                    <span>{amount ? "Indicative quote" : "$0.00"}</span>
                    {account && <button type="button">Max</button>}
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
                    <span>Balance: {account ? "—" : "0"}</span>
                  </div>
                  <div className="asset-row">
                    <TokenPicker
                      value={tokenOut}
                      exclude={tokenIn.symbol}
                      onChange={(token) => setTokenOut(token)}
                    />
                    <div className={estimate ? "estimate" : "estimate muted"}>{estimate || "0.00"}</div>
                  </div>
                  <div className="field-foot">
                    <span>{estimate && estimate !== "—" ? "Preview only" : "$0.00"}</span>
                  </div>
                </div>

                <div className="route-summary">
                  <span>Slippage tolerance</span>
                  <strong>{slippage}%</strong>
                </div>

                <button
                  className="primary-action"
                  type="button"
                  onClick={handlePrimaryAction}
                  disabled={walletBusy}
                >
                  {!account ? "Connect wallet" : "Review swap"}
                </button>
              </>
            ) : (
              <div className="pool-panel">
                <div className="pool-orb">LB</div>
                <h2>Ultra liquidity pools</h2>
                <p>
                  Create and manage Lime B positions once the AMM contract is deployed on Ultra Testnet.
                </p>
                <button className="primary-action" type="button" onClick={handlePrimaryAction}>
                  {!account ? "Connect wallet" : "Create position"}
                </button>
              </div>
            )}

            {notice && <div className="notice">{notice}</div>}
          </div>

          <div className="powered">
            <span>Built for</span>
            <strong>ULTRA</strong>
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
              <span>Total liquidity</span>
              <strong>—</strong>
            </div>
            <div className="stat">
              <span>7d volume</span>
              <strong>—</strong>
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
