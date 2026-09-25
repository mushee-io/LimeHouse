import AppHeader from "@/components/AppHeader";
import Link from "next/link";

export default function LiquidityPage() {
  return (
    <main className="lb-app-shell">
      <div className="lb-texture" aria-hidden="true" />
      <AppHeader />

      <section className="lb-liquidity-stage">
        <div className="lb-section-intro">
          <span>Liquidity on Ultra</span>
          <h1>Put capital to work.</h1>
          <p>Fund the live UOS / LIME pool and manage LimeBay liquidity without dashboard clutter.</p>
        </div>

        <div className="lb-liquidity-cards">
          <article className="primary">
            <span>Pool 0</span>
            <strong>UOS / LIME</strong>
            <p>Live on Ultra Testnet with atomic deposit, LP minting and 0.30% execution fees.</p>
            <div>
              <Link href="/pools">Explore pool</Link>
              <Link href="/trade">Trade pair</Link>
            </div>
          </article>
          <article><span>Execution</span><strong>Atomic</strong><p>Deposit and protocol action settle together.</p></article>
          <article><span>Network</span><strong>Ultra</strong><p>Native testnet execution and Ultra Wallet signing.</p></article>
        </div>
      </section>

      <footer className="lb-app-footer">
        <div><strong>LimeBay</strong><span>Liquidity infrastructure for Ultra.</span></div>
        <div><span>Pool 0</span><span>0.30% fee</span><span>© 2026 LimeBay</span></div>
      </footer>
    </main>
  );
}
