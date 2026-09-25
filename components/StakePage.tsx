import AppHeader from "@/components/AppHeader";

export default function StakePage() {
  return (
    <main className="app-page future-page">
      <div className="app-top-strip acid">
        <span>LIME B STAKE</span><span>Ultra Testnet</span><span>Future module</span>
      </div>
      <AppHeader />
      <section className="future-hero">
        <div>
          <span className="eyebrow dot">Protocol expansion</span>
          <h1>STAKE<br />WITH<br />PURPOSE</h1>
          <p>Staking is intentionally separated from the live AMM. This page is the future Lime B staking surface without pretending a staking contract exists today.</p>
          <span className="future-status">NOT LIVE YET</span>
        </div>
        <div className="future-art"><i/><i/><i/></div>
      </section>
    </main>
  );
}
