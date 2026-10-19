"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { BarChart3, ChevronDown, Menu, MoreHorizontal, Search, X } from "lucide-react";
import LimeLogo from "@/components/LimeLogo";
import { useUltraWallet } from "@/components/WalletProvider";

const NAV = [
  { label: "Trade", href: "/trade" },
  { label: "Explore", href: "/pools" },
  { label: "Pool", href: "/liquidity" },
  { label: "Portfolio", href: "/portfolio" }
];
const EXTRA = [
  { label: "Swap", href: "/swap" },
  { label: "Earn", href: "/stake" },
  { label: "Analytics", href: "/analytics" },
  { label: "Governance", href: "/governance" },
  { label: "Bridge", href: "/bridge" }
];
const ALL = [...NAV, ...EXTRA];

export default function AppHeader({ marketing = false }: { marketing?: boolean }) {
  const pathname = usePathname();
  const { account, busy, error, connect, disconnect, clearError } = useUltraWallet();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => ALL.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase())), [query]);

  async function handleWallet() {
    try {
      if (account) await disconnect();
      else await connect();
    } catch {
      // WalletProvider exposes the error message below the header.
    }
  }

  const short = account ? account.length > 15 ? `${account.slice(0, 6)}…${account.slice(-4)}` : account : "";

  if (marketing) {
    return (
      <header className="lh-topbar">
        <Link href="/" className="lh-logo-link"><LimeLogo compact /><strong>LimeHouse</strong></Link>
        <Link href="/trade" className="lh-header-connect">Explore DEX</Link>
      </header>
    );
  }

  return (
    <>
      <header className="lh-topbar" aria-label="LimeHouse navigation">
        <div className="lh-topbar-left">
          <Link href="/" className="lh-logo-link" aria-label="LimeHouse homepage">
            <LimeLogo compact /><strong>LimeHouse</strong><ChevronDown size={14} aria-hidden="true" />
          </Link>
          <nav className="lh-main-nav" aria-label="DEX sections">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={pathname === item.href || (item.href === "/trade" && pathname === "/swap") ? "active" : ""}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="lh-header-actions">
          <span className="lh-network-tag" title="LimeHouse currently uses Ultra Testnet">Ultra Testnet</span>
          <button
            className={searchOpen ? "lh-icon-button active" : "lh-icon-button"}
            aria-label={searchOpen ? "Close search" : "Search DEX sections"}
            aria-expanded={searchOpen}
            type="button"
            onClick={() => { setSearchOpen(!searchOpen); setMenuOpen(false); }}
          ><Search size={21} /></button>
          <button
            className={menuOpen ? "lh-icon-button active" : "lh-icon-button"}
            aria-label="More destinations"
            aria-expanded={menuOpen}
            type="button"
            onClick={() => { setMenuOpen(!menuOpen); setSearchOpen(false); }}
          ><MoreHorizontal size={23} /></button>
          <button className="lh-header-connect" type="button" onClick={handleWallet} disabled={busy}>
            {busy ? "Connecting…" : account ? short : "Connect"}
          </button>
          <button type="button" className="lh-mobile-menu-button" aria-label="Open navigation" onClick={() => { setMenuOpen(!menuOpen); setSearchOpen(false); }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {searchOpen && (
          <div className="lh-header-popover lh-header-search">
            <label htmlFor="lh-site-search">Go to a section</label>
            <input id="lh-site-search" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder="Search Trade, Pools, Portfolio…" />
            <div className="lh-search-results">
              {filtered.map((item) => <Link href={item.href} key={item.href} onClick={() => setSearchOpen(false)}>{item.label}<span>↗</span></Link>)}
              {filtered.length === 0 && <span className="lh-no-results">No matching sections</span>}
            </div>
          </div>
        )}
        {menuOpen && (
          <nav className="lh-header-popover lh-header-more" aria-label="More LimeHouse sections">
            <div className="lh-menu-mobile-only">{NAV.map((item) => <Link href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>)}</div>
            {EXTRA.map((item) => <Link href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>)}
            <Link href="/analytics" onClick={() => setMenuOpen(false)} className="lh-menu-analytics"><BarChart3 size={16} /> View protocol data</Link>
          </nav>
        )}
      </header>
      {error && <div className="lh-wallet-notice" role="alert"><span>{error}</span><button type="button" onClick={clearError} aria-label="Dismiss wallet error"><X size={18}/></button></div>}
    </>
  );
}
