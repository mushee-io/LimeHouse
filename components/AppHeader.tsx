"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LimeLogo from "@/components/LimeLogo";
import { connectUltraWallet, disconnectUltraWallet } from "@/lib/ultraWallet";

const LINKS = [
  { href: "/trade", label: "Trade" },
  { href: "/pools", label: "Explore" },
  { href: "/stake", label: "Earn" },
  { href: "/portfolio", label: "Portfolio" }
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

  if (marketing) {
    return (
      <header className="lb-marketing-nav">
        <Link href="/" className="lb-marketing-brand">
          <LimeLogo />
          <span>LimeBay</span>
        </Link>
        <nav>
          <a href="#features">Features</a>
          <a href="#integrations">Integrations</a>
          <a href="#docs">Docs</a>
        </nav>
        <Link href="/trade" className="lb-launch-button">Launch AMM</Link>
      </header>
    );
  }

  return (
    <>
      <header className="lb-app-nav">
        <Link href="/" className="lb-app-brand">
          <span className="lb-logo-tile"><LimeLogo compact /></span>
          <strong>LimeBay</strong>
        </Link>

        <nav className="lb-app-links" aria-label="LimeBay app navigation">
          {LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "active" : ""}
            >
              {item.label}
              {item.href === "/trade" ? <span className="nav-caret">⌄</span> : null}
            </Link>
          ))}
        </nav>

        <div className="lb-app-actions">
          <span className="lb-theme-toggle" aria-hidden="true">☼</span>
          <button className="lb-connect" type="button" onClick={handleWallet} disabled={busy}>
            {busy ? "Working…" : account ? short : "Connect wallet"}
          </button>
        </div>
      </header>
      {notice && <div className="lb-wallet-notice">{notice}</div>}
    </>
  );
}
