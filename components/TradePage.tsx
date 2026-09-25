"use client";

import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import SwapPanel from "@/components/SwapPanel";
import LimeLogo from "@/components/LimeLogo";
import { fetchPool0, parseAsset, PoolRow } from "@/lib/ultraRpc";

export default function TradePage() {
  const [pool, setPool] = useState<PoolRow | null>(null);

  useEffect(() => {
    void fetchPool0().then(setPool).catch(() => setPool(null));
  }, []);

  const data = useMemo(() => {
    if (!pool) return { spot: "—", uos: "—", lime: "—", fee: "0.30%", shares: "—" };
    try {
      const a = parseAsset(pool.reserve0);
      const b = parseAsset(pool.reserve1);
      const uos = a.symbol === "UOS" ? a : b;
      const lime = a.symbol === "LIME" ? a : b;
      const u = Number(uos.units) / 10 ** uos.precision;
      const l = Number(lime.units) / 10 ** lime.precision;
      return {
        spot: u > 0 ? (l / u).toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—",
        uos: u.toLocaleString(undefined, { maximumFractionDigits: 8 }),
        lime: l.toLocaleString(undefined, { maximumFractionDigits: 6 }),
        fee: `${(Number(pool.fee_bps) / 100).toFixed(2)}%`,
        shares: Number(pool.total_shares).toLocaleString()
      };
    } catch {
      return { spot: "—", uos: "—", lime: "—", fee: "0.30%", shares: "—" };
    }
  }, [pool]);

  return (
    <main className="app-page trade-page">
      <div className="app-top-strip">
        <span>ULTRA TESTNET</span>
        <span>Pool 0 · UOS / LIME</span>
        <span>Live spot · 1 UOS = {data.spot} LIME</span>
      </div>
      <AppHeader />

      <section className="trade-layout">
        <div className="trade-market">
          <div className="pair-header">
            <div className="pair-identity">
              <span className="app-token-icon uos">U</span>
              <span className="app-token-icon lime"><LimeLogo compact /></span>
              <div>
                <strong>UOS / LIME</strong>
                <span>Ultra ↔ Lime B</span>
              </div>
            </div>

            <div className="pair-metrics">
              <div><strong>{data.spot}</strong><span>LIME / UOS</span></div>
              <div><strong>{data.uos}</strong><span>UOS reserve</span></div>
              <div><strong>{data.lime}</strong><span>LIME reserve</span></div>
              <div><strong>{data.fee}</strong><span>Pool fee</span></div>
            </div>
          </div>

          <div className="chart-toolbar">
            <div><button className="active">LIVE</button><button>1H</button><button>1D</button><button>1W</button></div>
            <span>Historical indexer coming next</span>
          </div>

          <div className="live-chart">
            <div className="chart-grid" />
            <div className="spot-line" />
            <div className="spot-label">1 UOS = {data.spot} LIME</div>
            <div className="chart-watermark">LIME B</div>
            <div className="chart-empty-copy">
              <strong>LIVE POOL STATE</strong>
              <span>Real reserves are live. Historical candles appear when the protocol indexer is connected.</span>
            </div>
          </div>

          <div className="trade-editorial-row">
            <div className="trade-copy">
              <span className="eyebrow dot">UOS / LIME</span>
              <h2>TRADE<br />THE NEXT WAVE</h2>
              <p>Swap Ultra assets against live Lime B liquidity with on-chain execution and clear slippage controls.</p>
            </div>

            <div className="pair-stats-card">
              <div><span>Pool shares</span><strong>{data.shares}</strong></div>
              <div><span>UOS reserve</span><strong>{data.uos}</strong></div>
              <div><span>LIME reserve</span><strong>{data.lime}</strong></div>
              <div><span>Trading fee</span><strong>{data.fee}</strong></div>
            </div>
          </div>
        </div>

        <aside className="trade-side">
          <div className="trending-strip">
            <span>◉ LIVE ON ULTRA</span>
            <strong>UOS / LIME</strong>
            <em>POOL 0</em>
          </div>
          <SwapPanel compact />
        </aside>
      </section>
    </main>
  );
}
