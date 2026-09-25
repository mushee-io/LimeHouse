import AppHeader from "@/components/AppHeader";

export default function GovernancePage() {
  return (
    <main className="app-page governance-page">
      <div className="app-top-strip governance">
        <span>Lime B is live on Ultra</span>
        <span>Community · Liquidity · Ecosystem</span>
        <span>Governance preview</span>
      </div>
      <AppHeader />

      <div className="governance-tabs">
        <button className="active">Overview</button>
        <button>Lock</button>
        <button>Proposals</button>
        <button>Farming</button>
        <button>Accounts</button>
      </div>

      <section className="governance-hero">
        <div className="governance-copy">
          <span className="eyebrow">Governance on Ultra</span>
          <h1>SHAPE A<br />BRIGHTER<br />ULTRA TOGETHER</h1>
          <p>Governance is a future Lime B module. The interface is ready without pretending voting is live before the contracts exist.</p>
          <span className="governance-status">COMING AFTER CORE LIQUIDITY</span>
        </div>

        <div className="governance-art" aria-hidden="true">
          <div className="gov-orb" />
          <div className="gov-disc d1" />
          <div className="gov-disc d2" />
          <div className="gov-disc d3" />
        </div>
      </section>

      <section className="governance-cards">
        <article><span>01</span><strong>Shape the ecosystem</strong><p>Future proposals will coordinate key protocol decisions.</p></article>
        <article><span>02</span><strong>Transparent by design</strong><p>Governance will be introduced only when the underlying contracts are ready.</p></article>
        <article><span>03</span><strong>Build together</strong><p>Lime B is being designed as shared infrastructure for Ultra.</p></article>
      </section>
    </main>
  );
}
