import AppHeader from "@/components/AppHeader";

export default function StakePage() {
  return (
    <main className="lb-app-shell">
      <div className="lb-texture" aria-hidden="true" />
      <AppHeader />

      <section className="lb-earn-stage">
        <div className="lb-earn-summary">
          <article>
            <span>Total staked</span>
            <strong>—</strong>
            <p>LIME staking module</p>
          </article>
          <article>
            <span>Your staked</span>
            <strong>0 LIME</strong>
            <p>Connect wallet to continue</p>
          </article>
          <article>
            <span>Pending unstake</span>
            <strong>—</strong>
            <p>No unstake pending</p>
          </article>
        </div>

        <section className="lb-stake-card">
          <div className="lb-wide-tabs">
            <button className="active">Stake</button>
            <button>Unstake</button>
          </div>

          <div className="lb-staking-title-row">
            <div>
              <strong>Staking tiers</strong>
              <span>Future LimeBay utility layer</span>
            </div>
            <span>0 staked</span>
          </div>

          <div className="lb-tier-labels">
            <span>Tier</span>
            <span>LP boost</span>
            <span>Fee benefits</span>
            <span>Protocol tools</span>
          </div>

          <div className="lb-tier-row">
            <div><strong>Tier 1</strong><span>1K LIME</span></div>
            <strong>Planned</strong><strong>Planned</strong><span>—</span>
          </div>
          <div className="lb-tier-row">
            <div><strong>Tier 2</strong><span>5K LIME</span></div>
            <strong>Planned</strong><strong>Planned</strong><span>—</span>
          </div>
          <div className="lb-tier-row">
            <div><strong>Tier 3</strong><span>10K LIME</span></div>
            <strong>Planned</strong><strong>Planned</strong><span>Roadmap</span>
          </div>

          <div className="lb-stake-input">
            <div>
              <span>Your stake</span>
              <button type="button">LIME ⌄</button>
            </div>
            <strong>0</strong>
          </div>

          <button className="lb-disabled-action" type="button" disabled>
            Staking contracts not live yet
          </button>
        </section>
      </section>

      <footer className="lb-app-footer">
        <div><strong>LimeBay</strong><span>Earn surfaces without fake yield.</span></div>
        <div><span>Ultra Testnet</span><span>Staking roadmap</span><span>© 2026 LimeBay</span></div>
      </footer>
    </main>
  );
}
