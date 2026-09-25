import AppHeader from "@/components/AppHeader";

export default function PortfolioPage() {
  return (
    <main className="app-page future-page portfolio-page">
      <div className="app-top-strip">
        <span>LIME B PORTFOLIO</span><span>Wallet positions</span><span>Ultra Testnet</span>
      </div>
      <AppHeader />
      <section className="future-hero">
        <div>
          <span className="eyebrow dot">Your Lime B</span>
          <h1>ONE VIEW<br />OF YOUR<br />LIQUIDITY</h1>
          <p>Connect an Ultra wallet from the navigation to access account-aware portfolio functionality as the position indexer is added.</p>
          <span className="future-status">PORTFOLIO INDEXER NEXT</span>
        </div>
        <div className="future-art portfolio"><i/><i/><i/></div>
      </section>
    </main>
  );
}
