"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import { connectUltraWallet } from "@/lib/ultraWallet";

export default function PortfolioPage() {
  const [account, setAccount] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function connect() {
    setBusy(true);
    setNotice("");
    try {
      const data = await connectUltraWallet();
      setAccount(data.blockchainid);
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

  return (
    <main className="lb-app-shell">
      <div className="lb-texture" aria-hidden="true" />
      <AppHeader />

      <section className="lb-portfolio-stage">
        <aside className="lb-portfolio-sidebar">
          <span>Net worth</span>
          <strong>—</strong>
          <div className="lb-side-rule" />
          <h3>LIME utility</h3>
          <p>Connect your wallet to view LimeBay positions.</p>
          <button type="button" onClick={connect} disabled={busy}>
            {busy ? "Connecting…" : "Connect wallet"}
          </button>
          <div className="lb-side-rule" />
          <span>Points</span>
          <strong>—</strong>
        </aside>

        <section className="lb-portfolio-panel">
          <div className="lb-portfolio-tabs">
            {["Overview", "Positions", "Orders", "History", "Rewards", "Redeem"].map((tab, index) => (
              <button type="button" key={tab} className={index === 0 ? "active" : ""}>{tab}</button>
            ))}
          </div>

          <div className="lb-wallet-empty">
            <span className="lb-wallet-glyph">▣</span>
            <h1>{account ? "Portfolio indexing next" : "Connect your wallet"}</h1>
            <p>
              {account
                ? `Wallet ${account.slice(0, 6)}…${account.slice(-4)} connected. Account indexing will populate positions here.`
                : "Connect Ultra Wallet to see your LimeBay overview, LP positions and activity."}
            </p>
            {!account && (
              <button type="button" onClick={connect} disabled={busy}>
                {busy ? "Connecting…" : "Connect wallet"}
              </button>
            )}
            {notice && <small className="lb-portfolio-notice">{notice}</small>}
          </div>
        </section>
      </section>

      <footer className="lb-app-footer">
        <div><strong>LimeBay</strong><span>Your Ultra liquidity in one place.</span></div>
        <div><span>Ultra Testnet</span><span>Portfolio indexer next</span><span>© 2026 LimeBay</span></div>
      </footer>
    </main>
  );
}
