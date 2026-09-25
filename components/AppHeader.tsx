"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LimeLogo from "@/components/LimeLogo";
import { connectUltraWallet, disconnectUltraWallet } from "@/lib/ultraWallet";

const APP_LINKS = [
  { href: "/swap", label: "Swap" },
  { href: "/trade", label: "Trade" },
  { href: "/pools", label: "Pools" },
  { href: "/liquidity", label: "Liquidity" },
  { href: "/stake", label: "Stake" },
  { href: "/analytics", label: "Analytics" },
  { href: "/governance", label: "Governance" },
  { href: "/bridge", label: "Bridge" }
];

export default function AppHeader({ marketing = false }: { marketing?: boolean }) {
  const pathname = usePathname();
  const [account, setAccount] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function handleWallet() {
    setNotice("");
    setBusy(true);
    try {
      if (account) {
        await disconnectUltraWallet();
        setAccount("");
      } else {
        const data = await connectUltraWallet();
        setAccount(data.blockchainid);
      }
    } catch (error) {
      setNotice(
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Ultra Wallet could not connect."
      );
    } finally {
      setBusy(false);
    }
  }

  const short = account ? `${account.slice(0, 5)}…${account.slice(-4)}` : "";

  return (
    <>
      <header className={marketing ? "global-nav marketing-nav" : "global-nav app-nav"}>
        <Link href="/" className="global-brand" aria-label="Lime B home">
          <LimeLogo />
          <span>Lime B</span>
        </Link>

        {marketing ? (
          <nav className="marketing-links" aria-label="Marketing navigation">
            <Link href="/trade">Trade</Link>
            <Link href="/pools">Pools</Link>
            <Link href="/liquidity">Liquidity</Link>
            <Link href="/portfolio">Portfolio</Link>
            <Link href="/analytics">Analytics</Link>
            <a href="#roadmap">Roadmap</a>
          </nav>
        ) : (
          <nav className="app-links" aria-label="Application navigation">
            {APP_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? "active" : ""}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="global-actions">
          {!marketing && <span className="ultra-pill"><i /> Ultra Testnet</span>}
          {marketing ? (
            <Link href="/trade" className="acid-button">
              Open Lime B <span>→</span>
            </Link>
          ) : (
            <button className="acid-button" type="button" onClick={handleWallet} disabled={busy}>
              {busy ? "Working…" : account ? short : "Connect wallet"} <span>→</span>
            </button>
          )}
        </div>
      </header>
      {notice && <div className="global-wallet-notice">{notice}</div>}
    </>
  );
}
