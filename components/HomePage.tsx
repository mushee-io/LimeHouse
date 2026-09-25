import Link from "next/link";
import AppHeader from "@/components/AppHeader";

export default function HomePage() {
  return (
    <main className="lb-home">
      <div className="lb-home-lines" aria-hidden="true" />
      <AppHeader marketing />

      <section className="lb-home-hero">
        <h1>
          Redefining
          <br />
          DeFi on Ultra
        </h1>
        <p>LimeBay is a professional liquidity layer built for the Ultra ecosystem.</p>
        <div className="lb-home-actions">
          <Link href="/trade" className="lb-home-primary">Launch AMM</Link>
          <Link href="/pools" className="lb-home-secondary">Explore pools</Link>
        </div>
        <div className="lb-ripple" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, index) => <i key={index} />)}
        </div>
      </section>

      <section className="lb-home-media" id="features">
        <div className="lb-media-noise" aria-hidden="true" />
        <div className="lb-media-copy">
          <span>Built for precise execution</span>
          <h2>Designed for<br /><em>Ultra liquidity.</em></h2>
        </div>
        <div className="lb-media-screen">
          <div className="lb-screen-top">
            <span>POOL 0</span>
            <span>UOS / LIME</span>
            <span>ULTRA TESTNET</span>
          </div>
          <div className="lb-screen-body">
            <div><small>Step 1</small><strong>Connect Ultra Wallet</strong></div>
            <div><small>Step 2</small><strong>Review live quote</strong></div>
            <div><small>Step 3</small><strong>Execute atomically</strong></div>
          </div>
        </div>
      </section>

      <section className="lb-home-engine" id="integrations">
        <div className="lb-engine-heading">
          <h2>The <span>Liquidity Engine</span></h2>
          <p>Swap. Pool. Build.</p>
        </div>

        <div className="lb-engine-grid">
          <div className="lb-engine-copy">
            <h3>Swap.<br />Provide.<br />Build.</h3>
            <p>One protocol. Native Ultra liquidity.</p>
            <div className="lb-engine-rule" />
            <span>Live UOS / LIME Pool 0</span>
          </div>

          <div className="lb-engine-card">
            <div className="lb-engine-card-head">
              <span>LimeBay AMM</span>
              <span>Live</span>
            </div>
            <div className="lb-engine-swap">
              <div>
                <small>You sell</small>
                <strong>UOS</strong>
              </div>
              <span>⇅</span>
              <div>
                <small>You receive</small>
                <strong>LIME</strong>
              </div>
            </div>
            <Link href="/trade">Open Trade</Link>
          </div>
        </div>
      </section>

      <section className="lb-home-final" id="docs">
        <h2>Professional DeFi.<br />Built for Ultra.</h2>
        <Link href="/trade">Launch AMM</Link>
      </section>

      <footer className="lb-home-footer">
        <strong>LimeBay</strong>
        <div>
          <span>Ultra Testnet</span>
          <span>UOS / LIME</span>
          <span>© 2026 LimeBay</span>
        </div>
      </footer>
    </main>
  );
}
