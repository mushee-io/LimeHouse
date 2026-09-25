import AppHeader from "@/components/AppHeader";

export default function BridgePage() {
  return (
    <main className="app-page future-page bridge-page">
      <div className="app-top-strip blue">
        <span>LIME B BRIDGE</span><span>Ultra ecosystem</span><span>Future integrations</span>
      </div>
      <AppHeader />
      <section className="future-hero">
        <div>
          <span className="eyebrow dot">Cross-chain access</span>
          <h1>MOVE<br />CAPITAL<br />TO ULTRA</h1>
          <p>The bridge surface is reserved for verified integrations. No bridge provider is presented as active until Lime B actually integrates it.</p>
          <span className="future-status">INTEGRATIONS COMING LATER</span>
        </div>
        <div className="future-art bridge"><i/><i/><i/></div>
      </section>
    </main>
  );
}
