import AppHeader from "@/components/AppHeader";
import SwapPanel from "@/components/SwapPanel";

export default function SwapPage() {
  return (
    <main className="lb-app-shell lh-dex lh-dex-trade">
      <AppHeader />
      <div className="lh-dex-center">
        <SwapPanel />
        <p className="lh-dex-footnote">LimeHouse · Ultra Testnet · UOS / LIME</p>
      </div>
    </main>
  );
}
