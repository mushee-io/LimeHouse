"use client";

import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import LimeLogo from "@/components/LimeLogo";
import { fetchPool0, parseAsset, PoolRow } from "@/lib/ultraRpc";

export default function AnalyticsPage() {
  const [pool, setPool] = useState<PoolRow | null>(null);

  useEffect(() => {
    void fetchPool0().then(setPool).catch(() => setPool(null));
  }, []);

  const data = useMemo(() => {
    if (!pool) return { uos: "—", lime: "—", shares: "—", fee: "—" };
    try {
      const a = parseAsset(pool.reserve0);
      const b = parseAsset(pool.reserve1);
      const uos = a.symbol === "UOS" ? a : b;
      const lime = a.symbol === "LIME" ? a : b;
      return {
        uos: (Number(uos.units) / 10 ** uos.precision).toLocaleString(undefined, { maximumFractionDigits: 8 }),
        lime: (Number(lime.units) / 10 ** lime.precision).toLocaleString(undefined, { maximumFractionDigits: 6 }),
        shares: Number(pool.total_shares).toLocaleString(),
        fee: `${(Number(pool.fee_bps) / 100).toFixed(2)}%`
      };
    } catch {
      return { uos: "—", lime: "—", shares: "—", fee: "—" };
    }
  }, [pool]);

  return (
    <main className="lb-app-shell">
      <div className="lb-texture" aria-hidden="true" />
      <AppHeader />

      <section className="lb-analytics-stage">
        <div className="lb-analytics-tabs">
          <button className="active">Overview</button>
          <button>Assets</button>
          <button>Pools</button>
          <button>Transactions</button>
        </div>

        <div className="lb-analytics-metrics">
          <article><span>UOS reserve</span><strong>{data.uos}</strong></article>
          <article><span>LIME reserve</span><strong>{data.lime}</strong></article>
          <article><span>LP shares</span><strong>{data.shares}</strong></article>
          <article><span>Pool fee</span><strong>{data.fee}</strong></article>
        </div>

        <div className="lb-analytics-table">
          <div className="head"><span>Asset</span><span>Reserve</span><span>Network</span><span>Status</span></div>
          <div className="row">
            <div><span className="app-token-icon uos">U</span><strong>UOS</strong></div>
            <strong>{data.uos}</strong><span>Ultra Testnet</span><em>Verified</em>
          </div>
          <div className="row">
            <div><span className="app-token-icon lime"><LimeLogo compact /></span><strong>LIME</strong></div>
            <strong>{data.lime}</strong><span>Ultra Testnet</span><em>Registered</em>
          </div>
        </div>

        <p className="lb-data-note">LimeBay only exposes live on-chain values here. Historical volume and fee charts stay hidden until the indexer is connected.</p>
      </section>

      <footer className="lb-app-footer">
        <div><strong>LimeBay</strong><span>Live protocol state, no fabricated metrics.</span></div>
        <div><span>Ultra Testnet</span><span>Pool 0</span><span>© 2026 LimeBay</span></div>
      </footer>
    </main>
  );
}
