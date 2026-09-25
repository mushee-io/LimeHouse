"use client";

import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import SwapPanel from "@/components/SwapPanel";
import { fetchPool0, parseAsset, PoolRow } from "@/lib/ultraRpc";

export default function TradePage() {
  const [pool, setPool] = useState<PoolRow | null>(null);
  const [tab, setTab] = useState("Swap");

  useEffect(() => {
    void fetchPool0().then(setPool).catch(() => setPool(null));
  }, []);

  const data = useMemo(() => {
    if (!pool) return { ratio: "—", uos: "—", lime: "—", fee: "0.30%", shares: "—", status: "Syncing" };
    try {
      const a = parseAsset(pool.reserve0);
      const b = parseAsset(pool.reserve1);
      const uos = a.symbol === "UOS" ? a : b;
      const lime = a.symbol === "LIME" ? a : b;
      const u = Number(uos.units) / 10 ** uos.precision;
      const l = Number(lime.units) / 10 ** lime.precision;
      return {
        ratio: u > 0 ? (l / u).toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—",
        uos: u.toLocaleString(undefined, { maximumFractionDigits: 8 }),
        lime: l.toLocaleString(undefined, { maximumFractionDigits: 6 }),
        fee: `${(Number(pool.fee_bps) / 100).toFixed(2)}%`,
        shares: Number(pool.total_shares).toLocaleString(),
        status: pool.enabled ? "Live" : "Paused"
      };
    } catch {
      return { ratio: "—", uos: "—", lime: "—", fee: "0.30%", shares: "—", status: "Unavailable" };
    }
  }, [pool]);

  const items = [
    { rank: "1", name: "UOS / LIME", meta: `1 UOS = ${data.ratio} LIME`, value: data.status },
    { rank: "2", name: "UOS reserve", meta: "Ultra native asset", value: data.uos },
    { rank: "3", name: "LIME reserve", meta: "LimeBay pool asset", value: data.lime },
    { rank: "4", name: "Pool fee", meta: "Pool 0 execution fee", value: data.fee },
    { rank: "5", name: "LP shares", meta: "Total minted shares", value: data.shares },
    { rank: "6", name: "Network", meta: "Settlement layer", value: "Ultra Testnet" }
  ];

  return (
    <main className="lb-app-shell">
      <div className="lb-texture" aria-hidden="true" />
      <AppHeader />

      <section className="lb-trade-stage">
        <div className="lb-trade-column">
          <div className="lb-mode-tabs">
            {["Swap", "Multi", "Limit", "DCA", "Transfer"].map((name) => (
              <button
                key={name}
                type="button"
                className={tab === name ? "active" : ""}
                onClick={() => setTab(name)}
              >
                {name}
              </button>
            ))}
          </div>

          {tab === "Swap" ? (
            <SwapPanel compact />
          ) : (
            <div className="lb-coming-card">
              <span className="lb-coming-kicker">{tab}</span>
              <strong>{tab} is part of the LimeBay execution roadmap.</strong>
              <p>
                The surface is designed now, but only the live Ultra swap path is enabled
                until the corresponding on-chain module is ready.
              </p>
              <button type="button" onClick={() => setTab("Swap")}>Back to Swap</button>
            </div>
          )}
        </div>

        <aside className="lb-trending-card">
          <div className="lb-trending-head">
            <strong>Protocol</strong>
            <div><span>LIVE</span><span>ULTRA</span></div>
          </div>

          <div className="lb-trending-list">
            {items.map((item) => (
              <article key={item.rank}>
                <span className="rank">{item.rank}</span>
                <span className="coin-dot">{item.rank === "1" ? "LB" : "•"}</span>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.meta}</small>
                </div>
                <div className="trend-value">
                  <strong>{item.value}</strong>
                  <i />
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <footer className="lb-app-footer">
        <div><strong>LimeBay</strong><span>Professional DeFi infrastructure on Ultra.</span></div>
        <div><span>Ultra Testnet</span><span>Pool 0 · UOS/LIME</span><span>© 2026 LimeBay</span></div>
      </footer>
    </main>
  );
}
