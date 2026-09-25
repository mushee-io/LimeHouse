import AppHeader from "@/components/AppHeader";
import SwapPanel from "@/components/SwapPanel";

export default function SwapPage() {
  return (
    <main className="lb-app-shell">
      <div className="lb-texture" aria-hidden="true" />
      <AppHeader />

      <section className="lb-swap-focus">
        <div className="lb-swap-copy">
          <span>Native Ultra liquidity</span>
          <h1>Swap without the noise.</h1>
          <p>
            Focused execution for LimeBay Pool 0 with live reserve quoting,
            slippage controls and Ultra Wallet signing.
          </p>
        </div>

        <SwapPanel />
      </section>

      <footer className="lb-app-footer">
        <div><strong>LimeBay</strong><span>Simple execution on Ultra.</span></div>
        <div><span>Pool 0 · UOS/LIME</span><span>Ultra Testnet</span><span>© 2026 LimeBay</span></div>
      </footer>
    </main>
  );
}
