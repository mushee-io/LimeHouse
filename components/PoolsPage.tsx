"use client";

import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import LimeLogo from "@/components/LimeLogo";
import { fetchPool0, parseAsset, PoolRow } from "@/lib/ultraRpc";

export default function PoolsPage() {
  const [pool, setPool] = useState<PoolRow | null>(null);

  useEffect(() => {
    void fetchPool0().then(setPool).catch(() => setPool(null));
  }, []);

  const data = useMemo(() => {
    if (!pool) return { uos: "—", lime: "—", shares: "—", fee: "—", status: "Unavailable" };
    try {
      const a = parseAsset(pool.reserve0);
      const b = parseAsset(pool.reserve1);
      const uos = a.symbol === "UOS" ? a : b;
      const lime = a.symbol === "LIME" ? a : b;
      const u = Number(uos.units) / 10 ** uos.precision;
      const l = Number(lime.units) / 10 ** lime.precision;
      return {
        uos: u.toLocaleString(undefined, { maximumFractionDigits: 8 }),
        lime: l.toLocaleString(undefined, { maximumFractionDigits: 6 }),
        shares: Number(pool.total_shares).toLocaleString(),
        fee: `${(Number(pool.fee_bps) / 100).toFixed(2)}%`,
        status: pool.enabled && u > 0 && l > 0 ? "Funded" : pool.enabled ? "Live" : "Paused"
      };
    } catch {
      return { uos: "—", lime: "—", shares: "—", fee: "—", status: "Unavailable" };
    }
  }, [pool]);

  return (
    <main className="app-page pools-page">
      <div className="app-top-strip acid">
        <span>BUILT ON ULTRA</span>
        <span>Trade, provide liquidity and build the next wave of DeFi.</span>
        <span>POOL 0 · {data.status}</span>
      </div>
      <AppHeader />

      <section className="pools-hero">
        <div className="pools-hero-copy">
          <span className="eyebrow">Liquidity markets on Ultra</span>
          <h1>LIME B POOLS</h1>
          <p>Provide liquidity, earn pool fees and power the Ultra economy.</p>
        </div>
        <div className="pools-hero-art" aria-hidden="true">
          <div className="pool-art-disc d1" />
          <div className="pool-art-disc d2" />
          <div className="pool-art-disc d3" />
          <div className="pool-art-lime"><span /></div>
        </div>
      </section>

      <section className="pools-content">
        <div className="analytics-tabs">
          <button className="active">Overview</button>
          <button>Assets</button>
          <button>Pools</button>
          <button>Transactions</button>
        </div>

        <div className="summary-cards">
          <article><span>UOS reserve</span><strong>{data.uos}</strong><i className="spark lime" /></article>
          <article><span>LIME reserve</span><strong>{data.lime}</strong><i className="spark violet" /></article>
          <article><span>LP shares</span><strong>{data.shares}</strong><i className="spark cyan" /></article>
          <article><span>Pool fee</span><strong>{data.fee}</strong><i className="spark yellow" /></article>
        </div>

        <div className="table-heading">
          <div>
            <h2>Pools</h2>
            <span>Live on-chain pool state</span>
          </div>
          <div className="table-controls">
            <button>All assets⌄</button>
            <label><span>⌕</span><input placeholder="Search by asset or pool…" /></label>
            <button>Filter settings⌄</button>
          </div>
        </div>

        <div className="pool-list-table">
          <div className="pool-list-head">
            <span>Pair</span><span>UOS reserve</span><span>LIME reserve</span><span>LP shares</span><span>Fee</span><span>Action</span>
          </div>
          <div className="pool-list-row">
            <div className="pool-pair">
              <span className="app-token-icon uos">U</span>
              <span className="app-token-icon lime"><LimeLogo compact /></span>
              <div><strong>UOS / LIME</strong><small>Ultra · Lime B</small></div>
            </div>
            <strong>{data.uos}</strong>
            <strong>{data.lime}</strong>
            <strong>{data.shares}</strong>
            <strong>{data.fee}</strong>
            <a href="/liquidity" className="mini-acid">ADD LIQ</a>
          </div>
        </div>
      </section>
    </main>
  );
}
