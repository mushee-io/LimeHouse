import AppHeader from "@/components/AppHeader";
import SwapPanel from "@/components/SwapPanel";

export default function SwapPage() {
  return (
    <main className="app-page swap-page">
      <div className="app-top-strip acid">
        <span>LIME B SWAP</span>
        <span>Ultra Testnet</span>
        <span>Pool 0 · UOS / LIME</span>
      </div>
      <AppHeader />

      <section className="swap-page-hero">
        <div className="swap-page-copy">
          <span className="eyebrow dot">Native Ultra liquidity</span>
          <h1>SWAP<br />WITHOUT<br />THE NOISE</h1>
          <p>
            A focused execution surface for Lime B Pool 0. Live reserves,
            on-chain quoting and Ultra Wallet signing.
          </p>
        </div>

        <SwapPanel />
      </section>
    </main>
  );
}
