import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import LimeLogo from "@/components/LimeLogo";

function Arrow() {
  return <span aria-hidden="true">→</span>;
}

export default function HomePage() {
  return (
    <main className="marketing-shell">
      <div className="market-marquee">
        <span>LIME B HAS BIG DREAMS</span>
        <i />
        <span>DEFI YOU WERE PROMISED</span>
        <i />
        <span>DECENTRALIZED, SECURE TRADING</span>
        <i />
        <span>BUILT FOR ULTRA</span>
      </div>

      <AppHeader marketing />

      <section className="home-hero">
        <div className="home-hero-copy">
          <span className="eyebrow">Decentralized finance for a brighter tomorrow</span>
          <h1>
            THE EXCHANGE
            <br />
            FOR THE ULTRA
            <br />
            ECONOMY
          </h1>
          <p>
            Lime B is a decentralized trading protocol on Ultra, building open,
            liquid and permissionless markets for everyone.
          </p>

          <div className="home-hero-actions">
            <Link href="/trade" className="acid-button large">
              Start trading <Arrow />
            </Link>
            <Link href="/pools" className="outline-button large">
              Explore pools
            </Link>
          </div>
        </div>

        <div className="home-hero-art" aria-hidden="true">
          <div className="lime-orbit orbit-one" />
          <div className="lime-orbit orbit-two" />
          <div className="protocol-machine">
            <div className="machine-disc disc-a" />
            <div className="machine-disc disc-b" />
            <div className="machine-disc disc-c" />
            <div className="machine-pipe pipe-a" />
            <div className="machine-pipe pipe-b" />
            <div className="hero-lime">
              <span />
            </div>
          </div>

          <div className="swap-preview">
            <div className="preview-tabs">
              <strong>Swap</strong>
              <span>Limit</span>
              <span>Recurring</span>
              <b>⚙</b>
            </div>

            <div className="preview-token">
              <small>From</small>
              <div>
                <span className="token-dot uos">U</span>
                <strong>UOS</strong>
                <em>0.0</em>
              </div>
            </div>

            <div className="preview-switch">⇅</div>

            <div className="preview-token">
              <small>To</small>
              <div>
                <span className="token-dot lime"><LimeLogo compact /></span>
                <strong>LIME</strong>
                <em>0.0</em>
              </div>
            </div>

            <Link href="/swap" className="acid-button preview-cta">
              Open swap
            </Link>

            <div className="preview-foot">
              <span>Pool 0 · UOS / LIME</span>
              <span>0.30%</span>
            </div>
          </div>

          <div className="hero-vertical-copy">
            TRADE
            <br />
            PROVIDE
            <br />
            EARN
            <br />
            BUILD
            <br />
            ON ULTRA
          </div>
        </div>
      </section>

      <section className="home-statement">
        <div>
          <span className="eyebrow dot">Built on Ultra</span>
          <h2>
            LIQUIDITY
            <br />
            WITHOUT LIMITS
          </h2>
          <p>
            Lime B combines simple trading, transparent liquidity and powerful
            on-chain tools for the Ultra economy.
          </p>
        </div>

        <div className="home-feature-grid">
          <Link href="/swap" className="home-feature acid">
            <span className="feature-icon">⇄</span>
            <strong>Swap</strong>
            <p>Trade Ultra assets instantly against live liquidity.</p>
            <Arrow />
          </Link>

          <Link href="/liquidity" className="home-feature">
            <span className="feature-icon">▱</span>
            <strong>Provide Liquidity</strong>
            <p>Fund Lime B pools and manage LP positions.</p>
            <Arrow />
          </Link>

          <Link href="/analytics" className="home-feature">
            <span className="feature-icon">▥</span>
            <strong>Explore Protocol</strong>
            <p>Inspect pool reserves, fee state and protocol data.</p>
            <Arrow />
          </Link>
        </div>
      </section>

      <section className="home-protocol">
        <div className="home-protocol-art">
          <div className="giant-disc">
            <div className="hero-lime small"><span /></div>
            <div className="pedestal p1" />
            <div className="pedestal p2" />
            <div className="pedestal p3" />
          </div>
          <div className="art-copy">
            OPEN
            <br />
            LIQUID
            <br />
            PERMISSIONLESS
            <br />
            BUILT FOR ULTRA
          </div>
        </div>

        <div className="home-protocol-copy">
          <span className="eyebrow dot">Protocol stats</span>
          <div className="marketing-stat-grid">
            <article>
              <strong>1</strong>
              <span>Live Pool</span>
              <i className="spark lime" />
            </article>
            <article>
              <strong>0.30%</strong>
              <span>Pool Fee</span>
              <i className="spark violet" />
            </article>
            <article>
              <strong>UOS</strong>
              <span>Native Asset</span>
              <i className="spark cyan" />
            </article>
            <article>
              <strong>LIME</strong>
              <span>Test Asset</span>
              <i className="spark yellow" />
            </article>
          </div>
        </div>
      </section>

      <section className="home-roadmap" id="roadmap">
        <div className="roadmap-copy">
          <span className="eyebrow dot">Roadmap</span>
          <h2>
            A BRIGHTER
            <br />
            ULTRA TOGETHER
          </h2>
          <p>
            From a working Testnet AMM to a complete liquidity layer for Ultra.
          </p>
        </div>

        <div className="roadmap-columns">
          <article>
            <i />
            <span>NOW</span>
            <strong>Core AMM</strong>
            <p>UOS / LIME Pool 0</p>
            <p>Atomic swaps</p>
            <p>Live reserves</p>
          </article>
          <article>
            <i />
            <span>NEXT</span>
            <strong>Liquidity UX</strong>
            <p>LP management</p>
            <p>Pool creation</p>
            <p>Position detail</p>
          </article>
          <article>
            <i />
            <span>THEN</span>
            <strong>Analytics</strong>
            <p>Swap history</p>
            <p>Volume indexing</p>
            <p>Fee analytics</p>
          </article>
          <article>
            <i />
            <span>LATER</span>
            <strong>Ultra Expansion</strong>
            <p>More assets</p>
            <p>Routing</p>
            <p>Ecosystem integrations</p>
          </article>
        </div>
      </section>

      <footer className="marketing-footer">
        <div className="footer-brand">
          <div className="footer-wordmark">
            <LimeLogo />
            <strong>Lime B</strong>
          </div>
          <p>
            The exchange for the Ultra economy.
            <br />
            Open markets. Real liquidity.
          </p>
        </div>

        <div className="footer-cols">
          <div>
            <strong>Product</strong>
            <Link href="/trade">Trade</Link>
            <Link href="/swap">Swap</Link>
            <Link href="/pools">Pools</Link>
            <Link href="/liquidity">Liquidity</Link>
          </div>
          <div>
            <strong>Protocol</strong>
            <Link href="/analytics">Analytics</Link>
            <Link href="/governance">Governance</Link>
            <span>Ultra Testnet</span>
          </div>
          <div>
            <strong>Build</strong>
            <span>Ultra Wallet</span>
            <span>On-chain pools</span>
            <span>Permissionless markets</span>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Lime B. Built on Ultra.</span>
          <span>Testnet protocol</span>
        </div>
      </footer>
    </main>
  );
}
