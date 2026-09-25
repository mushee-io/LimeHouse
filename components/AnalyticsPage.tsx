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
    <main className="app-page analytics-page">
      <div className="app-top-strip blue">
        <span>LIME B ANALYTICS</span>
        <span>Live on-chain state</span>
        <span>Ultra Testnet</span>
      </div>
      <AppHeader />

      <section className="analytics-content">
        <div className="analytics-tabs large">
          <button className="active">Overview</button>
          <button>Assets</button>
          <button>Pools</button>
          <button>Transactions</button>
        </div>

        <div className="analytics-hero-cards">
          <article><span>UOS in Pool 0</span><strong>{data.uos}</strong></article>
          <article><span>LIME in Pool 0</span><strong>{data.lime}</strong></article>
          <article><span>Total LP shares</span><strong>{data.shares}</strong></article>
        </div>

        <div className="analytics-section-title">
          <h1>PROTOCOL OVERVIEW</h1>
          <p>Only live on-chain values are shown. Volume and historical analytics remain hidden until an indexer is connected.</p>
        </div>

        <div className="asset-table">
          <div className="asset-table-head"><span>Asset</span><span>Pool reserve</span><span>Network</span><span>Status</span></div>
          <div className="asset-table-row">
            <div><span className="app-token-icon uos">U</span><strong>UOS</strong></div>
            <strong>{data.uos}</strong><span>Ultra Testnet</span><em>Verified</em>
          </div>
          <div className="asset-table-row">
            <div><span className="app-token-icon lime"><LimeLogo compact /></span><strong>LIME</strong></div>
            <strong>{data.lime}</strong><span>Ultra Testnet</span><em>Registered</em>
          </div>
        </div>
      </section>
    </main>
  );
}
