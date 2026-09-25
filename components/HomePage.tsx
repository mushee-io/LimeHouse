"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import LimeLogo from "@/components/LimeLogo";
import { connectUltraWallet, disconnectUltraWallet } from "@/lib/ultraWallet";
import { fetchPool0, parseAsset, PoolRow } from "@/lib/ultraRpc";

export default function HomePage() {
  const [pool, setPool] = useState<PoolRow | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [bridgeOpen, setBridgeOpen] = useState(false);
  const [account, setAccount] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void fetchPool0().then(setPool).catch(() => setPool(null));
  }, []);

  const stats = useMemo(() => {
    if (!pool) {
      return {
        uos: "—",
        lime: "—",
        shares: "—",
        fee: "0.30%",
        status: "Pool 0"
      };
    }

    try {
      const a = parseAsset(pool.reserve0);
      const b = parseAsset(pool.reserve1);
      const uos = a.symbol === "UOS" ? a : b;
      const lime = a.symbol === "LIME" ? a : b;
      const uosValue = Number(uos.units) / 10 ** uos.precision;
      const limeValue = Number(lime.units) / 10 ** lime.precision;

      return {
        uos: uosValue.toLocaleString(undefined, { maximumFractionDigits: 8 }),
        lime: limeValue.toLocaleString(undefined, { maximumFractionDigits: 6 }),
        shares: Number(pool.total_shares).toLocaleString(),
        fee: `${(Number(pool.fee_bps) / 100).toFixed(2)}%`,
        status: pool.enabled && uosValue > 0 && limeValue > 0 ? "Pool 0 live" : "Pool 0"
      };
    } catch {
      return {
        uos: "—",
        lime: "—",
        shares: "—",
        fee: "0.30%",
        status: "Pool 0"
      };
    }
  }, [pool]);

  async function handleWallet() {
    setNotice("");
    setBusy(true);

    try {
      if (account) {
        await disconnectUltraWallet();
        setAccount("");
        setWalletOpen(false);
      } else {
        const data = await connectUltraWallet();
        setAccount(data.blockchainid);
        setWalletOpen(false);
      }
    } catch (error) {
      setNotice(
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Ultra Wallet could not connect."
      );
    } finally {
      setBusy(false);
    }
  }

  const shortAccount = account ? `${account.slice(0, 5)}…${account.slice(-4)}` : "";

  return (
    <main className="ref-home">
      <div className="ref-announcement">
        <div>
          <span className="ref-star">✦</span>
          <span>Lime B is live on Ultra</span>
          <span className="ref-announcement-dash">—</span>
          <span>Trade, provide liquidity and build the next wave of DeFi.</span>
        </div>
        <div>
          <Link href="/trade">Open app</Link>
          <span>→</span>
        </div>
      </div>

      <header className="ref-nav">
        <Link href="/" className="ref-brand">
          <LimeLogo />
          <strong>Lime B</strong>
        </Link>

        <div className="ref-search">
          <span>⌕</span>
          <input aria-label="Search Lime B" placeholder="Search tokens, pools, addresses…" />
          <kbd>/</kbd>
        </div>

        <nav className="ref-main-links" aria-label="Lime B navigation">
          <Link href="/trade">Trade</Link>
          <Link href="/pools">Pools</Link>
          <Link href="/stake">Stake</Link>
          <Link href="/analytics">Analytics</Link>
          <Link href="/governance">Governance</Link>
          <button
            type="button"
            className={bridgeOpen ? "active" : ""}
            onClick={() => setBridgeOpen((value) => !value)}
          >
            Bridge
          </button>
        </nav>

        <div className="ref-nav-actions">
          <span className="ref-bell">◌</span>
          <button type="button" className="ref-wallet-button" onClick={() => setWalletOpen(true)}>
            {account ? shortAccount : "Connect wallet"} <span>→</span>
          </button>
        </div>

        {bridgeOpen && (
          <div className="ref-bridge-menu">
            <div>
              <span className="ref-bridge-icon rings">◉</span>
              <div>
                <strong>Ultra bridge directory</strong>
                <small>Cross-chain routes for the Ultra ecosystem</small>
              </div>
              <em>→</em>
            </div>
            <div>
              <span className="ref-bridge-icon arch">⌒</span>
              <div>
                <strong>Liquidity bridges</strong>
                <small>Verified integrations will appear here</small>
              </div>
              <em>→</em>
            </div>
            <div>
              <span className="ref-bridge-icon mint">M</span>
              <div>
                <strong>More assets</strong>
                <small>BTC, ETH and stablecoin routes are planned</small>
              </div>
              <em>→</em>
            </div>
          </div>
        )}
      </header>

      <nav className="ref-subnav" aria-label="Homepage sections">
        <Link href="/" className="active"><span>▥</span> Overview</Link>
        <Link href="/swap"><span>⇄</span> Swap</Link>
        <Link href="/pools"><span>▱</span> Pools</Link>
        <Link href="/liquidity"><span>◫</span> Liquidity</Link>
        <Link href="/portfolio"><span>▢</span> Accounts</Link>
      </nav>

      <section className="ref-hero">
        <div className="ref-hero-copy">
          <span className="ref-kicker">Lime B on Ultra</span>
          <h1>
            SHAPE A
            <br />
            BRIGHTER
            <br />
            ULTRA TOGETHER
          </h1>
          <p>
            Trade UOS and LIME, provide liquidity and help build the native
            liquidity layer for the Ultra ecosystem.
          </p>
          <Link href="/trade" className="ref-primary-cta">
            Open Lime B <span>→</span>
          </Link>
        </div>

        <div className="ref-hero-art" aria-hidden="true">
          <div className="ref-blob lime" />
          <div className="ref-blob violet" />
          <div className="ref-chrome-stage">
            <div className="ref-disc disc-1" />
            <div className="ref-disc disc-2" />
            <div className="ref-disc disc-3" />
            <div className="ref-lime-fruit"><span /></div>
          </div>
          <div className="ref-side-copy">
            COMMUNITY
            <br />
            LIQUIDITY
            <br />
            ECOSYSTEM
            <br />
            FOR A BRIGHTER
            <br />
            TOMORROW
          </div>
        </div>
      </section>

      <section className="ref-stats">
        <article>
          <strong>{stats.uos}</strong>
          <span>UOS reserve</span>
          <i className="ref-spark lime" />
        </article>
        <article>
          <strong>{stats.lime}</strong>
          <span>LIME reserve</span>
          <i className="ref-spark violet" />
        </article>
        <article>
          <strong>{stats.shares}</strong>
          <span>LP shares</span>
          <i className="ref-spark cyan" />
        </article>
        <article>
          <strong>{stats.fee}</strong>
          <span>Pool fee</span>
          <i className="ref-spark yellow" />
        </article>
      </section>

      <section className="ref-lower">
        <article className="ref-get-started">
          <div className="ref-get-copy">
            <span className="ref-kicker">Get started</span>
            <h2>
              Connect your wallet
              <br />
              and enter Lime B
            </h2>
            <p>
              Use Ultra Wallet to trade, inspect Pool 0 and interact with Lime B
              on Ultra Testnet.
            </p>
            <div>
              <button type="button" className="ref-primary-cta" onClick={() => setWalletOpen(true)}>
                Connect wallet <span>→</span>
              </button>
              <Link href="/trade" className="ref-secondary-cta">Open app</Link>
            </div>
          </div>

          <div className="ref-glass-bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </article>

        <article className="ref-why">
          <span className="ref-kicker">Why Lime B</span>

          <div>
            <span className="ref-round-icon">◉</span>
            <section>
              <strong>Native Ultra liquidity</strong>
              <p>Pool 0 is deployed and funded on Ultra Testnet.</p>
            </section>
          </div>

          <div>
            <span className="ref-round-icon">◇</span>
            <section>
              <strong>Real execution</strong>
              <p>Live reserve quotes and wallet-signed atomic swaps.</p>
            </section>
          </div>

          <div>
            <span className="ref-round-icon">▥</span>
            <section>
              <strong>Build together</strong>
              <p>A growing protocol surface for the Ultra ecosystem.</p>
            </section>
          </div>
        </article>
      </section>

      {walletOpen && (
        <div className="ref-modal-backdrop" onClick={() => setWalletOpen(false)}>
          <section className="ref-wallet-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="ref-modal-close"
              onClick={() => setWalletOpen(false)}
              aria-label="Close wallet modal"
            >
              ×
            </button>

            <h2>Connect to a wallet</h2>
            <p>
              Connect an Ultra Testnet wallet to interact with Lime B.
            </p>

            <button type="button" className="ref-wallet-option" onClick={handleWallet} disabled={busy}>
              <span className="ref-wallet-logo ultra">U</span>
              <div>
                <strong>{busy ? "Connecting…" : account ? "Disconnect Ultra Wallet" : "Ultra Wallet"}</strong>
                <small>{account ? shortAccount : "Browser extension · Ultra Testnet"}</small>
              </div>
              <em>→</em>
            </button>

            <div className="ref-wallet-option muted">
              <span className="ref-wallet-logo wc">≈</span>
              <div>
                <strong>WalletConnect</strong>
                <small>Not connected yet</small>
              </div>
              <em>Soon</em>
            </div>

            {notice && <div className="ref-wallet-notice">{notice}</div>}
          </section>
        </div>
      )}
    </main>
  );
}
