import AppHeader from "@/components/AppHeader";
import Link from "next/link";

export default function LiquidityPage() {
  return (
    <main className="app-page liquidity-page">
      <div className="app-top-strip acid">
        <span>LIME B LIQUIDITY</span>
        <span>Ultra Testnet</span>
        <span>Pool 0 · UOS / LIME</span>
      </div>
      <AppHeader />

      <section className="liquidity-hero">
        <div>
          <span className="eyebrow dot">Provide on Ultra</span>
          <h1>PUT CAPITAL<br />TO WORK</h1>
          <p>Manage liquidity for Lime B pools through a clean, transparent LP experience.</p>
        </div>
        <div className="liquidity-art" aria-hidden="true">
          <div className="liquid-pillar p1" />
          <div className="liquid-pillar p2" />
          <div className="liquid-pillar p3" />
        </div>
      </section>

      <section className="liquidity-grid">
        <article className="liquidity-primary">
          <span className="eyebrow">Pool 0</span>
          <h2>UOS / LIME</h2>
          <p>The first Lime B pool is funded and live on Ultra Testnet.</p>
          <div className="liquidity-actions">
            <Link href="/pools" className="acid-button">View pool →</Link>
            <Link href="/swap" className="outline-button">Swap assets</Link>
          </div>
        </article>
        <article><strong>0.30%</strong><span>Pool fee</span></article>
        <article><strong>ATOMIC</strong><span>Deposit + LP mint</span></article>
        <article><strong>ULTRA</strong><span>Native execution</span></article>
      </section>
    </main>
  );
}
