import AppHeader from "@/components/AppHeader";

export default function GovernancePage() {
  return (
    <main className="lb-app-shell">
      <div className="lb-texture" aria-hidden="true" />
      <AppHeader />

      <section className="lb-future-stage">
        <div className="lb-future-copy">
          <span>Governance on Ultra</span>
          <h1>Shape LimeBay together.</h1>
          <p>Governance is intentionally presented as a future module until voting and locking contracts are actually deployed.</p>
          <strong>Coming after core liquidity</strong>
        </div>
        <div className="lb-future-grid">
          <article><span>01</span><strong>Proposals</strong><p>Protocol decisions with transparent on-chain execution.</p></article>
          <article><span>02</span><strong>Locking</strong><p>LIME utility without pretending a live lock contract exists.</p></article>
          <article><span>03</span><strong>Community</strong><p>A clean path toward shared ownership of Ultra liquidity infrastructure.</p></article>
        </div>
      </section>

      <footer className="lb-app-footer">
        <div><strong>LimeBay</strong><span>Governance when the contracts are ready.</span></div>
        <div><span>Ultra</span><span>Roadmap</span><span>© 2026 LimeBay</span></div>
      </footer>
    </main>
  );
}
