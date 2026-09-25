import AppHeader from "@/components/AppHeader";

export default function BridgePage() {
  return (
    <main className="lb-app-shell">
      <div className="lb-texture" aria-hidden="true" />
      <AppHeader />

      <section className="lb-future-stage">
        <div className="lb-future-copy">
          <span>Cross-chain access</span>
          <h1>Move liquidity to Ultra.</h1>
          <p>LimeBay will only surface bridge routes after verified integrations are complete.</p>
          <strong>Integrations coming later</strong>
        </div>
        <div className="lb-future-grid">
          <article><span>01</span><strong>Stablecoins</strong><p>Verified routes for stable assets when available.</p></article>
          <article><span>02</span><strong>BTC & ETH</strong><p>Professional cross-chain discovery without fake routes.</p></article>
          <article><span>03</span><strong>Ultra assets</strong><p>Bring more liquidity into the LimeBay AMM.</p></article>
        </div>
      </section>

      <footer className="lb-app-footer">
        <div><strong>LimeBay</strong><span>Verified routes only.</span></div>
        <div><span>Ultra ecosystem</span><span>Future integrations</span><span>© 2026 LimeBay</span></div>
      </footer>
    </main>
  );
}
