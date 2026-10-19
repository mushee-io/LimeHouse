import AppHeader from "@/components/AppHeader";
import SwapPanel from "@/components/SwapPanel";

export default function TradePage() {
  return (
    <main className="lb-app-shell lh-dex lh-dex-trade">
      <AppHeader />
      <div className="lh-dex-center">
        <SwapPanel compact />
        <p className="lh-dex-footnote">LimeHouse · Ultra Testnet · UOS / LIME</p>
      </div>
    </main>
  );
}
