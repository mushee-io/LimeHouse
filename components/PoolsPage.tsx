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
    if (!pool) return { uos: "—", lime: "—", shares: "—", fee: "—", ratio: "—", status: "Syncing" };
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
        ratio: u > 0 ? (l / u).toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—",
        status: pool.enabled && u > 0 && l > 0 ? "Live" : pool.enabled ? "Empty" : "Paused"
      };
    } catch {
      return { uos: "—", lime: "—", shares: "—", fee: "—", ratio: "—", status: "Unavailable" };
    }
  }, [pool]);

  return (
    <main className="lb-app-shell">
      <div className="lb-texture" aria-hidden="true" />
      <AppHeader />

      <section className="lb-explore-stage">
        <div className="lb-metric-grid">
          <article>
            <div className="metric-head"><span>UOS Reserve</span><span>LIVE</span></div>
            <strong>{data.uos}</strong>
            <div className="metric-chart"><i/><i/><i/><i/><i/><i/></div>
          </article>
          <article>
            <div className="metric-head"><span>LIME Reserve</span><span>POOL 0</span></div>
            <strong>{data.lime}</strong>
            <div className="metric-chart alt"><i/><i/><i/><i/><i/><i/></div>
          </article>
          <article>
            <div className="metric-head"><span>LP Shares</span><span>{data.status}</span></div>
            <strong>{data.shares}</strong>
            <div className="metric-chart soft"><i/><i/><i/><i/><i/><i/></div>
          </article>
        </div>

        <div className="lb-explore-toolbar">
          <div className="lb-segmented">
            <button className="active">Pools</button>
            <button>Vaults</button>
          </div>
          <label className="lb-search-field">
            <span>⌕</span>
            <input placeholder="Search by token, pair, or address…" />
          </label>
          <a href="/liquidity" className="lb-create-pool">＋ Add liquidity</a>
          <button className="lb-filter-button">☷ Filters</button>
        </div>

        <div className="lb-pools-table">
          <div className="lb-pools-head">
            <span>Pool</span>
            <span>Spot</span>
            <span>UOS reserve</span>
            <span>LIME reserve</span>
            <span>Fee</span>
            <span>Status</span>
          </div>

          <div className="lb-pool-line">
            <div className="lb-pair-cell">
              <span className="app-token-icon uos">U</span>
              <span className="app-token-icon lime"><LimeLogo compact /></span>
              <div><strong>UOS / LIME</strong><small>Ultra · LimeBay</small></div>
            </div>
            <strong>1 : {data.ratio}</strong>
            <strong>{data.uos}</strong>
            <strong>{data.lime}</strong>
            <strong>{data.fee}</strong>
            <span className="lb-status-pill">{data.status}</span>
          </div>

          <div className="lb-pool-line muted-row">
            <div className="lb-pair-cell">
              <span className="lb-placeholder-token">＋</span>
              <div><strong>More Ultra pools</strong><small>Permissionless expansion</small></div>
            </div>
            <span>—</span><span>—</span><span>—</span><span>—</span><span>Coming next</span>
          </div>
        </div>
      </section>

      <footer className="lb-app-footer">
        <div><strong>LimeBay</strong><span>Explore liquidity on Ultra.</span></div>
        <div><span>Pool 0 · UOS/LIME</span><span>{data.status}</span><span>© 2026 LimeBay</span></div>
      </footer>
    </main>
  );
}
